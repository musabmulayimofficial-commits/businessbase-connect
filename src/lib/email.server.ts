// Server-only e-posta katmanı.
// Gönderim yalnızca sunucu tarafında yapılır.
// API anahtarları istemciye sızmaz.
// E-posta gönderimi Resend üzerinden yapılır.

export interface AppEmail {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

const BRAND = {
  bg: "#ffffff",
  ink: "#111318",
  muted: "#5b6270",
  accent: "#2563eb",
  border: "#e6e8ee",
};

function layout(
  title: string,
  body: string,
  cta?: { label: string; url: string },
) {
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>

<body style="margin:0;background:${BRAND.bg};font-family:Arial,Helvetica,sans-serif;color:${BRAND.ink}">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">

    <div style="font-size:18px;font-weight:700;letter-spacing:-0.2px">
      BusinessBase
    </div>

    <div style="height:1px;background:${BRAND.border};margin:16px 0 24px"></div>

    <h1 style="font-size:20px;line-height:1.35;margin:0 0 16px">
      ${escapeHtml(title)}
    </h1>

    <div style="font-size:14px;line-height:1.7;color:${BRAND.ink}">
      ${body}
    </div>

    ${
      cta
        ? `<div style="margin:28px 0 8px">
            <a
              href="${escapeAttr(cta.url)}"
              style="display:inline-block;background:${BRAND.accent};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600"
            >
              ${escapeHtml(cta.label)}
            </a>
          </div>`
        : ""
    }

    <div style="height:1px;background:${BRAND.border};margin:28px 0 16px"></div>

    <p style="font-size:12px;color:${BRAND.muted};margin:0">
      BusinessBase — girişimci networkü
    </p>

  </div>
</body>
</html>`;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

export interface ApplicationSummary {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  profession: string;
  entrepreneurship_status: string;
  reason: string;
  created_at: string;
  ai_score?: number | null;
  ai_decision?: string | null;
  ai_reason?: string | null;
}

function detailRows(app: ApplicationSummary) {
  const rows: Array<[string, string]> = [
    ["Ad Soyad", app.full_name],
    ["E-posta", app.email],
    ["Telefon", app.phone],
    ["Şehir", app.city],
    ["Meslek / Sektör", app.profession],
    ["Girişimcilik Durumu", app.entrepreneurship_status],
    ["Başvuru nedeni", app.reason],
    [
      "Başvuru tarihi",
      new Date(app.created_at).toLocaleString("tr-TR"),
    ],
  ];

  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    ${rows
      .map(
        ([k, v]) =>
          `<tr>
            <td style="padding:6px 0;color:${BRAND.muted};width:170px;vertical-align:top">
              ${escapeHtml(k)}
            </td>
            <td style="padding:6px 0;vertical-align:top">
              ${escapeHtml(v)}
            </td>
          </tr>`,
      )
      .join("")}
  </table>`;
}

export function adminNewApplicationEmail(
  to: string,
  app: ApplicationSummary,
  decisionUrls: { approve: string; reject: string },
): AppEmail {
  const ai =
    app.ai_decision == null
      ? `<p style="margin:16px 0 0;color:${BRAND.muted}">
          Yapay zekâ değerlendirmesi henüz tamamlanmadı.
        </p>`
      : `<p style="margin:16px 0 0">
          <strong>AI puanı:</strong> ${app.ai_score ?? "-"}
          ·
          <strong>AI kararı:</strong> ${escapeHtml(app.ai_decision)}
          <br />
          <span style="color:${BRAND.muted}">
            ${escapeHtml(app.ai_reason ?? "")}
          </span>
        </p>`;

  return {
    to,
    subject: "Yeni BusinessBase üyelik başvurusu",
    html: layout(
      "Yeni bir üyelik başvurusu geldi",
      `${detailRows(app)}${ai}
      <div style="margin:28px 0 8px">
        <a href="${escapeAttr(decisionUrls.approve)}" style="display:inline-block;background:#15803d;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">ONAYLA</a>
        <a href="${escapeAttr(decisionUrls.reject)}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;margin-left:8px">REDDET</a>
      </div>
      <p style="margin:16px 0 0;color:${BRAND.muted};font-size:12px">Bu bağlantılar tek kullanımlıktır ve 72 saat sonra geçersiz olur.</p>`,
    ),
  };
}

export function adminManualReviewEmail(
  to: string,
  app: ApplicationSummary,
  adminUrl: string,
  note?: string,
): AppEmail {
  return {
    to,
    subject: "BusinessBase başvurusu inceleme bekliyor",
    html: layout(
      "Manuel inceleme gerekiyor",
      `${detailRows(app)}

      <p style="margin:16px 0 0">
        <strong>AI puanı:</strong> ${app.ai_score ?? "-"}
        ·
        <strong>AI kararı:</strong>
        ${escapeHtml(app.ai_decision ?? "manual_review")}
      </p>

      <p style="margin:8px 0 0;color:${BRAND.muted}">
        ${escapeHtml(note ?? app.ai_reason ?? "")}
      </p>

      <p style="margin:16px 0 0">
        Yönetici panelinden başvuruyu onaylayabilir veya reddedebilirsin.
      </p>`,
      {
        label: "Yönetici panelini aç",
        url: adminUrl,
      },
    ),
  };
}

export function applicantApprovedEmail(
  to: string,
  fullName: string,
  joinUrl: string,
): AppEmail {
  return {
    to,
    subject: "BusinessBase üyelik başvurun onaylandı 🎉",
    html: layout(
      "Başvurun onaylandı",
      `<p style="margin:0">
        Merhaba ${escapeHtml(fullName)},
      </p>

      <p style="margin:12px 0 0">
        BusinessBase üyelik başvurun incelendi ve onaylandı.
      </p>

      <p style="margin:12px 0 0">
        Artık BusinessBase networküne katılabilirsin.
      </p>`,
      {
        label: "BusinessBase'e Katıl",
        url: joinUrl,
      },
    ),
  };
}

export function applicantRejectedEmail(
  to: string,
  fullName: string,
): AppEmail {
  return {
    to,
    subject: "BusinessBase üyelik başvurun hakkında",
    html: layout(
      "Başvurun hakkında",
      `<p style="margin:0">
        Merhaba ${escapeHtml(fullName)},
      </p>

      <p style="margin:12px 0 0">
        Başvurunu dikkatle inceledik. Şu dönem için üyeliğini açamıyoruz.
      </p>

      <p style="margin:12px 0 0">
        Bu karar çalışmanın değeriyle ilgili değil; topluluğun mevcut
        odağıyla uyum üzerinden veriliyor. İlerleyen dönemde tekrar
        başvurabilirsin.
      </p>

      <p style="margin:12px 0 0">
        İlgin için teşekkür ederiz.
      </p>`,
    ),
  };
}

export function adminAiFailureEmail(
  to: string,
  app: ApplicationSummary,
  adminUrl: string,
): AppEmail {
  return {
    to,
    subject: "BusinessBase başvurusu inceleme bekliyor",
    html: layout(
      "AI değerlendirmesi tamamlanamadı, manuel inceleme gerekiyor",
      detailRows(app),
      {
        label: "Yönetici panelini aç",
        url: adminUrl,
      },
    ),
  };
}

/**
 * Gerçek e-posta gönderimi.
 *
 * Resend API kullanılır.
 * RESEND_API_KEY yalnızca sunucu ortamından okunur.
 */
export async function sendAppEmail(
  email: AppEmail,
): Promise<SendResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["RESEND_FROM_EMAIL"]?.trim();

  if (!apiKey || !from) {
    console.warn(
      `[email] RESEND_API_KEY bulunamadı: ${email.subject} -> ${email.to}`,
    );

    return {
      sent: false,
      reason: !apiKey ? "resend_api_key_missing" : "resend_from_email_missing",
    };
  }

  try {
    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },

        body: JSON.stringify({
          from,
          to: [email.to],
          subject: email.subject,
          html: email.html,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();

      console.error(
        `[email] Resend gönderim başarısız [${response.status}]: ${body}`,
      );

      return {
        sent: false,
        reason: `resend_failed_${response.status}`,
      };
    }

    return {
      sent: true,
    };
  } catch (error) {
    console.error(
      "[email] Resend gönderim hatası",
      error,
    );

    return {
      sent: false,
      reason: "resend_error",
    };
  }
}
