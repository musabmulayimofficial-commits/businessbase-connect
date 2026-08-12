// Server-only: başvuru değerlendirme mantığı (AI + karar + e-posta orkestrasyonu).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  adminAiFailureEmail,
  adminManualReviewEmail,
  adminNewApplicationEmail,
  applicantApprovedEmail,
  applicantRejectedEmail,
  sendAppEmail,
  type ApplicationSummary,
} from "./email.server";

export type AiDecision = "approve" | "manual_review" | "reject";

export interface AiReview {
  score: number;
  decision: AiDecision;
  reason: string;
}

const SYSTEM_PROMPT = `Sen BusinessBase adlı Türk girişimci networkünün üyelik başvurularını değerlendiren bir inceleme asistanısın.
Başvuruyu şu kriterlerle değerlendir:
- girişimcilik ilgisi
- profesyonel profil
- BusinessBase'e katılma amacının netliği
- network oluşturma potansiyeli
- başvurunun gerçek ve anlamlı görünmesi
- spam, anlamsız, saldırgan veya açıkça sahte içerik olup olmadığı

Kurallar:
- Şüpheli, spam, boş/anlamsız, saldırgan veya sahte görünen başvurularda decision daima "manual_review" veya "reject" olmalı, asla "approve" olmamalı.
- Yalnızca çok net, gerçek ve nitelikli başvurulara 85+ puan ver.
- Puan 85-100 => approve, 60-84 => manual_review, 0-59 => reject veya manual_review.
- reason alanı Türkçe, en fazla 2 cümle olsun.
Sadece JSON döndür: {"score": number, "decision": "approve"|"manual_review"|"reject", "reason": string}`;

export function normalizeDecision(score: number, decision: AiDecision): AiDecision {
  if (score >= 85 && decision === "approve") return "approve";
  if (score >= 85) return decision;
  if (score >= 60) return decision === "reject" ? "manual_review" : "manual_review";
  return decision === "approve" ? "manual_review" : decision;
}

export async function runAiReview(app: ApplicationSummary): Promise<AiReview | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    console.error("[ai] LOVABLE_API_KEY yok, değerlendirme yapılamadı");
    return null;
  }

  const userContent = [
    `Ad Soyad: ${app.full_name}`,
    `E-posta: ${app.email}`,
    `Telefon: ${app.phone}`,
    `Şehir: ${app.city}`,
    `Meslek / Sektör: ${app.profession}`,
    `Girişimcilik Durumu: ${app.entrepreneurship_status}`,
    `Başvuru nedeni: ${app.reason}`,
  ].join("\n");

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_review",
              description: "Başvuru değerlendirme sonucunu döndür",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "0-100 arası puan" },
                  decision: { type: "string", enum: ["approve", "manual_review", "reject"] },
                  reason: { type: "string", description: "Türkçe kısa gerekçe" },
                },
                required: ["score", "decision", "reason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_review" } },
      }),
    });

    if (!response.ok) {
      console.error(`[ai] Gateway hatası [${response.status}]: ${await response.text()}`);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{ function?: { arguments?: string } }>;
        };
      }>;
    };

    const args =
      payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ??
      payload.choices?.[0]?.message?.content ??
      null;
    if (!args) return null;

    const parsed = JSON.parse(args) as Partial<AiReview>;
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
    if (!Number.isFinite(score)) return null;
    const decision: AiDecision =
      parsed.decision === "approve" || parsed.decision === "reject" ? parsed.decision : "manual_review";

    return {
      score,
      decision: normalizeDecision(score, decision),
      reason: (parsed.reason ?? "").toString().slice(0, 500),
    };
  } catch (error) {
    console.error("[ai] Değerlendirme hatası", error);
    return null;
  }
}

export function statusFromDecision(decision: AiDecision) {
  if (decision === "approve") return "approved" as const;
  if (decision === "reject") return "rejected" as const;
  return "manual_review" as const;
}

export async function logApplicationEvent(input: {
  application_id: string;
  actor: string;
  actor_id?: string | null;
  decision: string;
  score?: number | null;
  reason?: string;
}) {
  const { error } = await supabaseAdmin.from("application_events").insert({
    application_id: input.application_id,
    actor: input.actor,
    actor_id: input.actor_id ?? null,
    decision: input.decision,
    score: input.score ?? null,
    reason: input.reason ?? "",
  });
  if (error) console.error("[audit] Kayıt yazılamadı", error);
}

export function adminUrlFor(origin: string, applicationId?: string) {
  return applicationId ? `${origin}/admin?basvuru=${applicationId}` : `${origin}/admin`;
}

/** Hiçbir e-posta hatası başvuru akışını durdurmaz. */
export async function safeSend(
  applicationId: string,
  kind: string,
  build: () => import("./email.server").AppEmail,
) {
  try {
    const result = await sendAppEmail(build());
    if (!result.sent) {
      await logApplicationEvent({
        application_id: applicationId,
        actor: "system",
        decision: `email_skipped:${kind}`,
        reason: result.reason ?? "unknown",
      });
    }
  } catch (error) {
    console.error(`[email] ${kind} gönderilemedi`, error);
  }
}

export const emails = {
  adminNewApplicationEmail,
  adminManualReviewEmail,
  adminAiFailureEmail,
  applicantApprovedEmail,
  applicantRejectedEmail,
};

export type { ApplicationSummary };
