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

/**
 * Yeni başvuru oluşturur.
 *
 * Başvuru Supabase'e kaydedilir.
 * Başlangıç durumu: pending
 *
 * Kayıttan sonra ADMIN_EMAIL adresine
 * "Başvuruyu İncele" butonlu bildirim maili gönderilir.
 */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Aynı e-posta ile aktif başvuru kontrolü
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("applications")
      .select("id, status, created_at")
      .ilike("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(
        "[application] mevcut başvuru kontrolü:",
        existingError,
      );
    }

    // Daha önce aktif bir başvuru varsa tekrar oluşturma
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

    // Başvuruyu kaydet
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

    // ---------------------------------------------------------
    // YÖNETİCİYE BAŞVURU BİLDİRİM MAİLİ
    // ---------------------------------------------------------

    try {
      const adminEmail = process.env["ADMIN_EMAIL"];

      if (!adminEmail) {
        console.warn(
          "[email] ADMIN_EMAIL tanımlı değil.",
        );
      } else {
        const request = getRequest();

        const origin =
          request?.headers.get("origin") ??
          (request?.url
            ? new URL(request.url).origin
            : "https://businessbase-connect.vercel.app");

        const adminUrl = `${origin}/admin`;

        const server = await import("./applications.server");

        await server.safeSend(
          application.id,
          "admin_new_application",
          () =>
            server.emails.adminNewApplicationEmail(
              adminEmail,
              application,
              adminUrl,
            ),
        );

        console.log(
          "[email] yönetici bildirim maili gönderildi:",
          adminEmail,
        );
      }
    } catch (error) {
      // Mail hatası başvurunun kaydedilmesini engellemez.
      console.error(
        "[email] yönetici bildirim maili gönderilemedi:",
        error,
      );
    }

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
 * ADMIN_EMAIL ile eşleşen ve e-postası doğrulanmış kullanıcı admin kabul edilir.
 */
export const ensureAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const adminEmail = process.env["ADMIN_EMAIL"]
      ?.trim()
      .toLowerCase();

    const claims = context.claims as {
      email?: string;
    };

    const email = claims.email
      ?.trim()
      .toLowerCase();

    if (!adminEmail || !email || email !== adminEmail) {
      return {
        isAdmin: false,
      } as const;
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(
        context.userId,
      );

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

    return {
      isAdmin: true,
    } as const;
  });

/**
 * Admin başvuruyu onaylar veya reddeder.
 *
 * Admin kontrolü:
 * - Kullanıcı giriş yapmış olmalı.
 * - Kullanıcı e-postası ADMIN_EMAIL ile eşleşmeli.
 * - E-posta doğrulanmış olmalı.
 */
export const adminDecideApplication = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    decisionSchema.parse(data),
  )
  .handler(async ({ data, context }) => {
    const adminEmail = process.env["ADMIN_EMAIL"]
      ?.trim()
      .toLowerCase();

    if (!adminEmail) {
      console.error(
        "[admin] ADMIN_EMAIL tanımlı değil",
      );

      throw new Error(
        "ADMIN_EMAIL yapılandırılmamış",
      );
    }

    const claims = context.claims as {
      email?: string;
    };

    const loggedInEmail = claims.email
      ?.trim()
      .toLowerCase();

    if (
      !loggedInEmail ||
      loggedInEmail !== adminEmail
    ) {
      console.error(
        "[admin] Yetkisiz kullanıcı:",
        loggedInEmail,
      );

      throw new Error("Forbidden");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Admin kullanıcısını doğrula
    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(
        context.userId,
      );

    if (authUserError || !authUser?.user) {
      console.error(
        "[admin] kullanıcı doğrulama hatası:",
        authUserError,
      );

      throw new Error(
        "Kullanıcı doğrulanamadı",
      );
    }

    if (!authUser.user.email_confirmed_at) {
      throw new Error(
        "Admin e-posta adresi doğrulanmamış",
      );
    }

    if (
      authUser.user.email?.trim().toLowerCase() !==
      adminEmail
    ) {
      throw new Error("Forbidden");
    }

    // Başvuruyu bul
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
        findError,
      );

      throw new Error(
        "Başvuru bulunamadı",
      );
    }

    if (!existingApplication) {
      throw new Error(
        "Başvuru bulunamadı",
      );
    }

    // Başvuruyu güncelle
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
        error,
      );

      throw new Error(
        "Başvuru güncellenemedi",
      );
    }

    console.log(
      `[admin] başvuru ${data.decision}:`,
      application.id,
    );

    // Karar geçmişine kayıt
    try {
      const {
        error: eventError,
      } = await supabaseAdmin
        .from("application_events")
        .insert({
          application_id: application.id,
          actor: "admin",
          actor_id: context.userId,
          decision: data.decision,
          reason: data.note ?? "",
        });

      if (eventError) {
        console.error(
          "[admin] karar geçmişi kaydedilemedi:",
          eventError,
        );
      }
    } catch (eventError) {
      console.error(
        "[admin] karar geçmişi hatası:",
        eventError,
      );
    }

    return {
      ok: true,
      status: data.decision,
      application,
    } as const;
  });
