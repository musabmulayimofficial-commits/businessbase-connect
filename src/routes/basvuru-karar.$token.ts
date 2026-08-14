import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/basvuru-karar/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[a-f0-9]{64}$/.test(params.token)) {
          return decisionResponse("Geçersiz bağlantı", "Bu karar bağlantısı geçersiz veya bozuk görünüyor.", 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(params.token));
        const tokenHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
        const { data, error } = await supabaseAdmin.rpc("consume_application_decision_token", {
          p_token_hash: tokenHash,
        });

        if (error) {
          console.error("[application] karar tokenı tüketilemedi:", error);
          return decisionResponse("İşlem tamamlanamadı", "Lütfen daha sonra tekrar deneyin.", 500);
        }

        const result = data?.[0];
        if (!result) {
          return decisionResponse(
            "Bağlantı kullanılamıyor",
            "Bu bağlantı daha önce kullanılmış, süresi dolmuş veya başvuru zaten karara bağlanmış.",
            410,
          );
        }

        const { sendDecisionEmail } = await import("@/lib/applications.server");
        await sendDecisionEmail(
          { id: result.application_id, email: result.email, full_name: result.full_name },
          result.decision === "approved" ? "approved" : "rejected",
        );

        return decisionResponse(
          result.decision === "approved" ? "Başvuru onaylandı" : "Başvuru reddedildi",
          `${result.full_name} adlı başvuru sahibi sonuç hakkında e-posta ile bilgilendirildi.`,
        );
      },
    },
  },
});

function decisionResponse(title: string, message: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | BusinessBase</title></head><body style="margin:0;background:#f7f8fa;color:#111318;font-family:Arial,Helvetica,sans-serif"><main style="max-width:560px;margin:80px auto;padding:32px;background:#fff;border:1px solid #e6e8ee;border-radius:12px"><div style="font-weight:700;font-size:18px">BusinessBase</div><h1 style="font-size:24px;margin:28px 0 12px">${escapeHtml(title)}</h1><p style="line-height:1.6;color:#5b6270">${escapeHtml(message)}</p></main></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
        "x-robots-tag": "noindex, nofollow",
      },
    },
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}
