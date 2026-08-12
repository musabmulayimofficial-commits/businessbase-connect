import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const applicationSchema = z.object({
  full_name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20),
  city: z.string().trim().min(1).max(60),
  profession: z.string().trim().min(2).max(120),
  entrepreneurship_status: z.string().trim().min(1).max(60),
  reason: z.string().trim().min(30).max(1000),
});

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).optional(),
});

function requestOrigin() {
  const request = getRequest();
  const origin = request?.headers.get("origin");
  if (origin) return origin;
  const url = request?.url;
  return url ? new URL(url).origin : "https://businessbase.app";
}

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }) => {
    const origin = requestOrigin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const server = await import("./applications.server");

    // 14 — Aynı e-postadan kısa süre içinde tekrar başvuru koruması
    const { data: existing } = await supabaseAdmin
      .from("applications")
      .select("id, status, created_at")
      .ilike("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const ageMs = Date.now() - new Date(existing.created_at).getTime();
      const recent = ageMs < 1000 * 60 * 60 * 24 * 30;
      if (existing.status !== "rejected" || recent) {
        return { ok: true, duplicate: true, status: existing.status } as const;
      }
    }

    // 1 — Başvuruyu kaydet (her koşulda veritabanında kalır)
    const { data: inserted, error } = await supabaseAdmin
      .from("applications")
      .insert({ ...data, status: "pending" })
      .select("*")
      .single();

    if (error || !inserted) {
      console.error("[application] kayıt hatası", error);
      throw new Error("Başvuru kaydedilemedi");
    }

    const adminEmail = process.env["ADMIN_EMAIL"];
    const adminUrl = server.adminUrlFor(origin, inserted.id);

    await server.logApplicationEvent({
      application_id: inserted.id,
      actor: "system",
      decision: "submitted",
      reason: "Başvuru alındı",
    });

    // 3 — Yöneticiye yeni başvuru e-postası (AI henüz tamamlanmadı)
    if (adminEmail) {
      await server.safeSend(inserted.id, "admin_new_application", () =>
        server.emails.adminNewApplicationEmail(adminEmail, inserted, adminUrl),
      );
    }

    // 4 — AI değerlendirmesi
    const review = await server.runAiReview(inserted);

    if (!review) {
      // 13 — AI çalışmazsa başvuru manuel incelemeye düşer
      await supabaseAdmin
        .from("applications")
        .update({ status: "manual_review", ai_reason: "AI değerlendirmesi tamamlanamadı" })
        .eq("id", inserted.id);
      await server.logApplicationEvent({
        application_id: inserted.id,
        actor: "system",
        decision: "manual_review",
        reason: "AI değerlendirmesi tamamlanamadı",
      });
      if (adminEmail) {
        await server.safeSend(inserted.id, "admin_ai_failure", () =>
          server.emails.adminAiFailureEmail(adminEmail, inserted, adminUrl),
        );
      }
      return { ok: true, duplicate: false, status: "manual_review" } as const;
    }

    const status = server.statusFromDecision(review.decision);
    const reviewedAt = status === "manual_review" ? null : new Date().toISOString();

    await supabaseAdmin
      .from("applications")
      .update({
        status,
        ai_score: review.score,
        ai_decision: review.decision,
        ai_reason: review.reason,
        reviewed_at: reviewedAt,
      })
      .eq("id", inserted.id);

    await server.logApplicationEvent({
      application_id: inserted.id,
      actor: "ai",
      decision: review.decision,
      score: review.score,
      reason: review.reason,
    });

    const enriched = {
      ...inserted,
      ai_score: review.score,
      ai_decision: review.decision,
      ai_reason: review.reason,
    };

    if (status === "approved") {
      await server.safeSend(inserted.id, "applicant_approved", () =>
        server.emails.applicantApprovedEmail(
          enriched.email,
          enriched.full_name,
          `${origin}/kayit-ol?email=${encodeURIComponent(enriched.email)}`,
        ),
      );
    } else if (status === "rejected") {
      await server.safeSend(inserted.id, "applicant_rejected", () =>
        server.emails.applicantRejectedEmail(enriched.email, enriched.full_name),
      );
    } else if (adminEmail) {
      await server.safeSend(inserted.id, "admin_manual_review", () =>
        server.emails.adminManualReviewEmail(adminEmail, enriched, adminUrl),
      );
    }

    return { ok: true, duplicate: false, status } as const;
  });

/** Giriş yapan kullanıcının e-postası ADMIN_EMAIL ile eşleşiyorsa admin rolü verir. */
export const ensureAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminEmail = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
    const claims = context.claims as { email?: string; email_verified?: boolean };
    const email = claims.email?.trim().toLowerCase();

    const { data: alreadyAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (alreadyAdmin) return { isAdmin: true } as const;

    if (!adminEmail || !email || email !== adminEmail) return { isAdmin: false } as const;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (!authUser?.user?.email_confirmed_at) return { isAdmin: false } as const;
    if (authUser.user.email?.trim().toLowerCase() !== adminEmail) return { isAdmin: false } as const;

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error && error.code !== "23505") {
      console.error("[admin] rol verilemedi", error);
      return { isAdmin: false } as const;
    }
    return { isAdmin: true } as const;
  });

export const adminDecideApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => decisionSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const origin = requestOrigin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const server = await import("./applications.server");

    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .update({
        status: data.decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error || !application) throw new Error("Başvuru güncellenemedi");

    await server.logApplicationEvent({
      application_id: application.id,
      actor: "admin",
      actor_id: context.userId,
      decision: data.decision,
      score: application.ai_score,
      reason: data.note ?? "",
    });

    if (data.decision === "approved") {
      await server.safeSend(application.id, "applicant_approved", () =>
        server.emails.applicantApprovedEmail(
          application.email,
          application.full_name,
          `${origin}/kayit-ol?email=${encodeURIComponent(application.email)}`,
        ),
      );
    } else {
      await server.safeSend(application.id, "applicant_rejected", () =>
        server.emails.applicantRejectedEmail(application.email, application.full_name),
      );
    }

    return { ok: true, status: data.decision } as const;
  });
