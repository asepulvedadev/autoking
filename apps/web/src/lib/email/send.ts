import "server-only";
import { Resend } from "resend";

/**
 * Envío de correos de AutoKing (server-only). Remitente institucional fijo:
 * soporte@autoking.pro. Nunca rompe el flujo del usuario si falla (devuelve
 * { ok:false } y se loguea). La RESEND_API_KEY vive en el env del server.
 */

export const FROM = "AutoKing 👑 <soporte@autoking.pro>";
export const SUPPORT_EMAIL = "soporte@autoking.pro";

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

export async function sendEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY ausente — correo no enviado:", args.subject);
    return { ok: false, error: "missing_api_key" };
  }

  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo ?? SUPPORT_EMAIL,
    });
    if (error) {
      console.error("[email] Resend error:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    console.error("[email] excepción:", (e as Error).message);
    return { ok: false, error: (e as Error).message };
  }
}
