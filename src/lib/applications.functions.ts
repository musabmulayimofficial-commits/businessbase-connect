import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* =========================================================
   BAŞVURU ŞEMASI
   ========================================================= */

const applicationSchema = z.object({
  full_name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20),
  city: z.string().trim().min(1).max(60),
  profession: z.string().trim().min(2).max(120),
  entrepreneurship_status: z
    .string()
    .trim()
    .min(1)
    .max(60),
  reason: z.string().trim().min(30).max(1000),
});

/* =========================================================
   ADMİN KARAR ŞEMASI
   ========================================================= */

const decisionSchema = z.object({
  id: z.coerce.number().int().positive(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).optional(),
});

/* =========================================================
   YENİ BAŞVURU
   ========================================================= */

export const submitApplication = createServerFn({
  method: "POST",
})
  .inputValidator((data: unknown) =>
    applicationSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    /* ---------------------------------------------
       Aynı e-posta ile mevcut başvuru kontrolü
       --------------------------------------------- */

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("applications")
      .select("id, status, created_at")
      .ilike("email", data.email)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(
        "[application] mevcut başvuru kontrolü:",
        existingError
      );
    }

    /* ---------------------------------------------
       Daha önce aktif başvuru varsa tekrar oluşturma
       --------------------------------------------- */

    if (
      existing &&
      [
        "pending",
        "approved",
        "manual_review",
      ].includes(existing.status)
    ) {
      return {
        ok: true,
        duplicate: true,
        status: existing.status,
      } as const;
    }

    /* ---------------------------------------------
       Yeni başvuru oluştur
       --------------------------------------------- */

    const {
      data: application,
      error,
    } = await supabaseAdmin
      .from("applications")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        profession: data.profession,
        entrepreneurship_status:
          data.entrepreneurship_status,
        reason: data.reason,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !application) {
      console.error(
        "[application] kayıt hatası:",
        error
      );

      throw new Error(
        "Başvuru kaydedilemedi."
      );
    }

    console.log(
      "[application] yeni başvuru:",
      application.id
    );

    try {
      const { applicationOrigin, createApplicationDecisionTokens, decisionUrl, emails, safeSend } = await import("@/lib/applications.server");
      const adminEmail = process.env["ADMIN_EMAIL"]?.trim();
      if (!adminEmail) throw new Error("ADMIN_EMAIL environment variable is required.");
      applicationOrigin();
      const tokens = await createApplicationDecisionTokens(application.id);
      await safeSend(application.id, "admin_new_application", () =>
        emails.adminNewApplicationEmail(adminEmail, application, {
          approve: decisionUrl(tokens.approve),
          reject: decisionUrl(tokens.reject),
        }),
      );
    } catch (emailError) {
      // The application is already stored; a retry must not create a duplicate record.
      console.error("[application] admin email preparation failed:", emailError);
    }

    return {
      ok: true,
      duplicate: false,
      status: "pending",
      application,
    } as const;
  });

/* =========================================================
   ADMİN KONTROLÜ
   =========================================================
   
   ADMIN_EMAIL ile giriş yapan kullanıcı admin kabul edilir.
   user_roles / has_role kullanılmaz.
   ========================================================= */

export const ensureAdminRole = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminEmail = process.env["ADMIN_EMAIL"]
      ?.trim()
      .toLowerCase();

    const claims = context.claims as {
      email?: string;
    };

    const loggedInEmail = claims.email
      ?.trim()
      .toLowerCase();

    if (
      !adminEmail ||
      !loggedInEmail ||
      loggedInEmail !== adminEmail
    ) {
      return {
        isAdmin: false,
      } as const;
    }

    return {
      isAdmin: true,
    } as const;
  });

/* =========================================================
   ADMİN BAŞVURU ONAY / RED
   ========================================================= */

export const adminDecideApplication = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    decisionSchema.parse(data)
  )
  .handler(async ({ data, context }) => {
    /* ---------------------------------------------
       ADMIN_EMAIL kontrolü
       --------------------------------------------- */

    const adminEmail = process.env["ADMIN_EMAIL"]
      ?.trim()
      .toLowerCase();

    const claims = context.claims as {
      email?: string;
    };

    const loggedInEmail = claims.email
      ?.trim()
      .toLowerCase();

    if (
      !adminEmail ||
      !loggedInEmail ||
      loggedInEmail !== adminEmail
    ) {
      console.error(
        "[admin] Yetkisiz kullanıcı:",
        loggedInEmail
      );

      throw new Error(
        "Bu işlem için admin yetkisi gerekiyor."
      );
    }

    /* ---------------------------------------------
       Supabase Admin Client
       --------------------------------------------- */

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    /* ---------------------------------------------
       Kullanıcının gerçekten var olduğunu kontrol et
       --------------------------------------------- */

    const {
      data: authUser,
      error: authError,
    } = await supabaseAdmin.auth.admin.getUserById(
      context.userId
    );

    if (
      authError ||
      !authUser?.user
    ) {
      console.error(
        "[admin] kullanıcı bulunamadı:",
        authError
      );

      throw new Error(
        "Kullanıcı doğrulanamadı."
      );
    }

    /* ---------------------------------------------
       E-posta doğrulaması
       --------------------------------------------- */

    if (!authUser.user.email_confirmed_at) {
      throw new Error(
        "Admin hesabının e-posta adresi doğrulanmamış."
      );
    }

    /* ---------------------------------------------
       Başvuruyu bul
       --------------------------------------------- */

    const {
      data: existingApplication,
      error: findError,
    } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (findError) {
      console.error(
        "[admin] başvuru arama hatası:",
        findError
      );

      throw new Error(
        "Başvuru bulunamadı."
      );
    }

    if (!existingApplication) {
      throw new Error(
        "Başvuru bulunamadı."
      );
    }

    /* ---------------------------------------------
       Başvuruyu ONAYLA / REDDET
       --------------------------------------------- */

    const {
      data: application,
      error,
    } = await supabaseAdmin
      .from("applications")
      .update({
        status: data.decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error || !application) {
      console.error(
        "[admin] başvuru güncelleme hatası:",
        error
      );

      throw new Error(
        "Başvuru güncellenemedi."
      );
    }

    /* ---------------------------------------------
       Log
       --------------------------------------------- */

    console.log(
      `[admin] başvuru ${data.decision}:`,
      application.id
    );

    /* ---------------------------------------------
       Başarılı cevap
       --------------------------------------------- */

    const { sendDecisionEmail } = await import("@/lib/applications.server");
    await sendDecisionEmail(application, data.decision);

    return {
      ok: true,
      status: data.decision,
      application,
    } as const;
  });
