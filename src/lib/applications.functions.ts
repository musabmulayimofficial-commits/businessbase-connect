import { createServerFn } from "@tanstack/react-start";
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

/**
 * Yeni başvuru oluşturur.
 *
 * Başvuru doğrudan Supabase'e kaydedilir.
 * Başlangıç durumu: pending
 */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Aynı e-posta ile daha önce aktif bir başvuru var mı?
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("applications")
      .select("id, status, created_at")
      .ilike("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("[application] mevcut başvuru kontrolü:", existingError);
    }

    // Daha önce pending / approved / manual_review bir başvuru varsa
    // tekrar başvuru oluşturma.
    if (
      existing &&
      ["pending", "approved", "manual_review"].includes(existing.status)
    ) {
      return {
        ok: true,
        duplicate: true,
        status: existing.status,
      } as const;
    }

    // Yeni başvuruyu oluştur
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        city: data.city,
        profession: data.profession,
        entrepreneurship_status: data.entrepreneurship_status,
        reason: data.reason,
        status: "pending",
      })
      .select("*")
      .single();

    if (error || !application) {
      console.error("[application] kayıt hatası:", error);
      throw new Error("Başvuru kaydedilemedi");
    }

    console.log(
      "[application] yeni başvuru oluşturuldu:",
      application.id,
    );

    return {
      ok: true,
      duplicate: false,
      status: "pending",
      application,
    } as const;
  });

/**
 * Giriş yapan kullanıcının admin olup olmadığını kontrol eder.
 *
 * ADMIN_EMAIL ile giriş yapan ve e-postası doğrulanmış kullanıcıya
 * admin rolü verir.
 */
export const ensureAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminEmail = process.env["ADMIN_EMAIL"]
      ?.trim()
      .toLowerCase();

    const claims = context.claims as {
      email?: string;
      email_verified?: boolean;
    };

    const email = claims.email?.trim().toLowerCase();

    // ADMIN_EMAIL tanımlı değilse admin olamaz
    if (!adminEmail || !email || email !== adminEmail) {
      return {
        isAdmin: false,
      } as const;
    }

    // Kullanıcının zaten admin rolü var mı?
    const { data: alreadyAdmin, error: roleCheckError } =
      await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });

    if (roleCheckError) {
      console.error(
        "[admin] rol kontrolü başarısız:",
        roleCheckError,
      );
    }

    if (alreadyAdmin) {
      return {
        isAdmin: true,
      } as const;
    }

    // E-posta doğrulamasını kontrol et
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(context.userId);

    if (authUserError || !authUser?.user) {
      console.error(
        "[admin] kullanıcı kontrolü başarısız:",
        authUserError,
      );

      return {
        isAdmin: false,
      } as const;
    }

    if (!authUser.user.email_confirmed_at) {
      return {
        isAdmin: false,
      } as const;
    }

    if (
      authUser.user.email?.trim().toLowerCase() !==
      adminEmail
    ) {
      return {
        isAdmin: false,
      } as const;
    }

    // Admin rolünü oluştur
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: context.userId,
        role: "admin",
      });

    // 23505 = zaten mevcut
    if (insertError && insertError.code !== "23505") {
      console.error(
        "[admin] rol verilemedi:",
        insertError,
      );

      return {
        isAdmin: false,
      } as const;
    }

    return {
      isAdmin: true,
    } as const;
  });

/**
 * Admin başvuruyu onaylar veya reddeder.
 */
export const adminDecideApplication = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    decisionSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    // Önce admin rolünü kontrol et
    const { data: isAdmin, error: roleError } =
      await context.supabase.rpc("has_role", {
        _user_id: context.userId,
        _role: "admin",
      });

    if (roleError) {
      console.error(
        "[admin] admin kontrolü başarısız:",
        roleError,
      );

      throw new Error("Admin kontrolü yapılamadı");
    }

    if (!isAdmin) {
      throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Başvuruyu güncelle
    const { data: application, error } =
      await supabaseAdmin
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
        error,
      );

      throw new Error("Başvuru güncellenemedi");
    }

    console.log(
      `[admin] başvuru ${data.decision}:`,
      application.id,
    );

    return {
      ok: true,
      status: data.decision,
      application,
    } as const;
  });
