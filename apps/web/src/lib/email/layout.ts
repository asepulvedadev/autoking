/* ============================================================
   AutoKing — Layout base de correos (institucional, accesible).
   Todos los emails (de la app Y de Rey) usan ESTA marca para verse
   idénticos. Diseño email-safe: tablas + estilos inline, max 600px,
   funciona en Gmail/Outlook/Apple Mail, con versión de texto plano.
   ============================================================ */

const LOGO = "https://www.autoking.pro/AutoKing-logo.png";
const SITE = "https://www.autoking.pro";
const SUPPORT = "soporte@autoking.pro";

// Paleta de marca
const C = {
  bg: "#05070d",
  card: "#0b1017",
  line: "#1a2230",
  headGrad: "linear-gradient(120deg,#0e1830,#0b1017)",
  heading: "#eaf2ff",
  text: "#9fb4cc",
  faint: "#6b7d92",
  blue: "#1e6bff",
  glow: "#7fd0ff",
};

export type EmailCTA = { label: string; url: string };

export type EmailContent = {
  /** Texto de preview (se ve en la bandeja antes de abrir). */
  preheader: string;
  heading: string;
  /** Párrafos del cuerpo (texto plano; se renderizan con estilo). */
  paragraphs?: string[];
  /** Bloque HTML opcional (ej. una tabla de datos de un lead). */
  bodyHtml?: string;
  cta?: EmailCTA;
  /** Nota chica al pie (ej. por qué recibís este correo). */
  footnote?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const p = (t: string) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${C.text};">${esc(t)}</p>`;

const button = (cta: EmailCTA) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;">
    <tr><td align="center" bgcolor="${C.blue}" style="border-radius:999px;">
      <a href="${esc(cta.url)}" target="_blank" rel="noopener"
         style="display:inline-block;padding:14px 30px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;background:${C.blue};">
        ${esc(cta.label)}
      </a>
    </td></tr>
  </table>`;

/** Devuelve el HTML completo del correo, con la marca AutoKing. */
export function renderEmail(c: EmailContent): string {
  const body = [
    ...(c.paragraphs ?? []).map(p),
    c.bodyHtml ?? "",
    c.cta ? button(c.cta) : "",
  ].join("\n");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="supported-color-schemes" content="dark light">
<title>${esc(c.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(c.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border:1px solid ${C.line};border-radius:16px;overflow:hidden;">
        <tr><td align="center" style="padding:28px 24px 22px;background:${C.headGrad};border-bottom:1px solid ${C.line};">
          <img src="${LOGO}" width="150" alt="AutoKing" style="display:block;width:150px;max-width:55%;height:auto;border:0;">
        </td></tr>
        <tr><td style="padding:32px 32px 26px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:${C.heading};font-weight:800;">${esc(c.heading)}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:22px 32px 28px;border-top:1px solid ${C.line};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <p style="margin:0 0 6px;font-size:13px;color:${C.glow};font-weight:700;">Automatiza. Inteligencia. Imperio. 👑</p>
          <p style="margin:0;font-size:12px;color:${C.faint};">
            AutoKing · <a href="mailto:${SUPPORT}" style="color:${C.blue};text-decoration:none;">${SUPPORT}</a> ·
            <a href="${SITE}" target="_blank" rel="noopener" style="color:${C.blue};text-decoration:none;">autoking.pro</a>
          </p>
          ${c.footnote ? `<p style="margin:10px 0 0;font-size:11px;color:${C.faint};">${esc(c.footnote)}</p>` : ""}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Versión de texto plano (deliverability + accesibilidad). */
export function renderText(c: EmailContent): string {
  const lines = [c.heading, "", ...(c.paragraphs ?? [])];
  if (c.cta) lines.push("", `${c.cta.label}: ${c.cta.url}`);
  lines.push("", "— AutoKing · Automatiza. Inteligencia. Imperio.", `${SUPPORT} · ${SITE}`);
  if (c.footnote) lines.push("", c.footnote);
  return lines.join("\n");
}
