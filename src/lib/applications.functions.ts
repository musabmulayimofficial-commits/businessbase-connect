import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
 * Yeni başvuru oluştur
 */
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: existing } = await supabaseAdmin
      .from("applications")
      .select("id, status")
      .ilike("email", data.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && existing.status !== "rejected") {
      return {
        ok: true,
        duplicate: true,
        status: existing.status,
      } as const;
    }

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
      console.error("Başvuru kayıt hatası:", error);
      throw new Error("Başvuru kaydedilemedi");
    }

    return {
      ok: true,
      duplicate: false,
      status: "pending",
      application,
    } as const;
  });

/**
 * Admin başvuruyu onaylar veya reddeder
 */
export const adminDecideApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => decisionSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: application, error } = await supabaseAdmin
      .from("applications")
      .update({
        status: data.decision,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .select("*")
      .single();

    if (error || !application) {
      console.error("Başvuru güncelleme hatası:", error);
      throw new Error("Başvuru güncellenemedi");
    }

    return {
      ok: true,
      status: data.decision,
      application,
    } as const;
  });
