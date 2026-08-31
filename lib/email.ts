import { Resend } from "resend";

/**
 * Wrapper sobre o SDK do Resend. A criação do cliente é lazy e o envio é
 * "best-effort": se RESEND_API_KEY não estiver configurada, apenas loga um
 * aviso no console em vez de lançar exceção — isso garante que o restante
 * do fluxo (criação da solicitação, notificação in-app, etc.) nunca quebre
 * por causa do e-mail.
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Fin-Hub <notificacoes@avante.com.br>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<void> {
  const client = getResendClient();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY não configurada — pulando envio de e-mail. Assunto: "${subject}", destinatário(s): ${
        Array.isArray(to) ? to.join(", ") : to
      }`
    );
    return;
  }
  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (err) {
    console.error("[email] Falha ao enviar e-mail via Resend:", err);
  }
}

// ---------- Templates ----------

function baseTemplate(opts: { preheader: string; title: string; bodyHtml: string; ctaLabel: string; ctaUrl: string }) {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f4f4f7;">${opts.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#4f46e5;padding:24px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">Fin-Hub · Avante</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${opts.title}</h1>
                <div style="font-size:14px;line-height:1.6;color:#374151;">${opts.bodyHtml}</div>
                <div style="margin-top:28px;">
                  <a href="${opts.ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">${opts.ctaLabel}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <span style="font-size:12px;color:#9ca3af;">Este é um e-mail automático do Fin-Hub. Não responda diretamente.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function requestUrl(requestId: string) {
  return `${APP_URL}/solicitacoes/${requestId}`;
}

export function newRequestEmail(params: {
  requestNumber: string;
  requestId: string;
  title: string;
  clientName: string;
  requesterName: string;
  requestTypeLabel: string;
  totalAmount: string | null;
}) {
  const { requestNumber, requestId, title, clientName, requesterName, requestTypeLabel, totalAmount } = params;
  return {
    subject: `Nova solicitação financeira - ${requestNumber}`,
    html: baseTemplate({
      preheader: `Nova solicitação financeira ${requestNumber} de ${requesterName}`,
      title: `Nova solicitação financeira — ${requestNumber}`,
      bodyHtml: `
        <p><strong>Título:</strong> ${title}</p>
        <p><strong>Solicitante:</strong> ${requesterName}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Tipo:</strong> ${requestTypeLabel}</p>
        ${totalAmount ? `<p><strong>Valor total:</strong> ${totalAmount}</p>` : ""}
        <p>Uma nova solicitação financeira foi registrada e aguarda análise.</p>
      `,
      ctaLabel: "ABRIR SOLICITAÇÃO",
      ctaUrl: requestUrl(requestId),
    }),
  };
}

export function mentionEmail(params: {
  requestNumber: string;
  requestId: string;
  mentionedByName: string;
  commentBody: string;
}) {
  const { requestNumber, requestId, mentionedByName, commentBody } = params;
  return {
    subject: `Você foi mencionado na solicitação ${requestNumber}`,
    html: baseTemplate({
      preheader: `${mentionedByName} mencionou você em ${requestNumber}`,
      title: `Você foi mencionado na solicitação ${requestNumber}`,
      bodyHtml: `
        <p><strong>${mentionedByName}</strong> mencionou você em um comentário:</p>
        <blockquote style="margin:12px 0;padding:12px 16px;background:#f3f4f6;border-left:3px solid #4f46e5;border-radius:4px;color:#374151;">${commentBody}</blockquote>
      `,
      ctaLabel: "ABRIR SOLICITAÇÃO",
      ctaUrl: requestUrl(requestId),
    }),
  };
}

export function assigneeChangedEmail(params: {
  requestNumber: string;
  requestId: string;
  title: string;
  clientName: string;
  requestTypeLabel: string;
  requesterName: string;
  lastComment: string | null;
}) {
  const { requestNumber, requestId, title, clientName, requestTypeLabel, requesterName, lastComment } = params;
  return {
    subject: `Uma solicitação financeira foi atribuída a você`,
    html: baseTemplate({
      preheader: `A solicitação ${requestNumber} foi atribuída a você`,
      title: `Solicitação ${requestNumber} atribuída a você`,
      bodyHtml: `
        <p><strong>Título:</strong> ${title}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Tipo:</strong> ${requestTypeLabel}</p>
        <p><strong>Solicitante:</strong> ${requesterName}</p>
        ${lastComment ? `<p><strong>Último comentário:</strong></p><blockquote style="margin:12px 0;padding:12px 16px;background:#f3f4f6;border-left:3px solid #4f46e5;border-radius:4px;color:#374151;">${lastComment}</blockquote>` : ""}
      `,
      ctaLabel: "ABRIR SOLICITAÇÃO",
      ctaUrl: requestUrl(requestId),
    }),
  };
}

export function newReplyEmail(params: {
  requestNumber: string;
  requestId: string;
  analystName: string;
  commentBody: string;
}) {
  const { requestNumber, requestId, analystName, commentBody } = params;
  return {
    subject: `Novo retorno na sua solicitação ${requestNumber}`,
    html: baseTemplate({
      preheader: `${analystName} respondeu sua solicitação ${requestNumber}`,
      title: `Novo retorno na solicitação ${requestNumber}`,
      bodyHtml: `
        <p><strong>${analystName}</strong> respondeu à sua solicitação:</p>
        <blockquote style="margin:12px 0;padding:12px 16px;background:#f3f4f6;border-left:3px solid #4f46e5;border-radius:4px;color:#374151;">${commentBody}</blockquote>
      `,
      ctaLabel: "ABRIR SOLICITAÇÃO",
      ctaUrl: requestUrl(requestId),
    }),
  };
}
