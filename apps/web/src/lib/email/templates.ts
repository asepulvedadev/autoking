/* ============================================================
   AutoKing — Plantillas de correo. Cada una devuelve { subject, html, text }
   ya con la marca (layout.ts). Usadas por la app y espejadas para Rey.
   ============================================================ */

import { renderEmail, renderText, type EmailContent } from "./layout";

const WA = "https://wa.me/573044643461";

function build(subject: string, c: EmailContent) {
  return { subject, html: renderEmail(c), text: renderText(c) };
}

const escRow = (s: string) => s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
function dataTable(rows: [string, string | null | undefined][]) {
  const trs = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;font-size:14px;color:#6b7d92;width:120px;vertical-align:top;">${k}</td>` +
        `<td style="padding:8px 0;font-size:14px;color:#eaf2ff;">${escRow(String(v))}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-top:1px solid #1a2230;">${trs}</table>`;
}

/** Bienvenida — cuando se crea la cuenta / se da de alta un cliente. */
export function welcomeClient(args: { businessName: string; contactName?: string | null }) {
  const hi = args.contactName ? `¡Hola, ${args.contactName}!` : "¡Bienvenido!";
  return build("Bienvenido a AutoKing 👑", {
    preheader: `${args.businessName} ya es parte de AutoKing.`,
    heading: `${hi} ${args.businessName} ya es parte de AutoKing 👑`,
    paragraphs: [
      "Gracias por confiar en nosotros. Desde ahora vas a tener un agente de IA que atiende, responde y agenda por WhatsApp 24/7, como un empleado que nunca duerme.",
      "En los próximos días conectamos tu WhatsApp y entrenamos a tu agente con tu negocio (servicios, precios y horarios). Cualquier cosa, respondé este correo y te ayudamos.",
    ],
    cta: { label: "Hablar con nosotros", url: WA },
    footnote: "Recibiste este correo porque tu negocio se registró en AutoKing.",
  });
}

/** Aviso interno al equipo — llegó un lead nuevo desde la landing. */
export function newLeadInternal(args: {
  name: string;
  business?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  message?: string | null;
}) {
  return build(`🔔 Nuevo lead: ${args.name}`, {
    preheader: `${args.name}${args.business ? ` · ${args.business}` : ""} dejó sus datos.`,
    heading: "🔔 Nuevo lead desde la landing",
    paragraphs: ["Un prospecto dejó sus datos. Contactalo rápido — el que responde primero, gana."],
    bodyHtml: dataTable([
      ["Nombre", args.name],
      ["Negocio", args.business],
      ["WhatsApp", args.whatsapp],
      ["Email", args.email],
      ["Mensaje", args.message],
    ]),
    cta: args.whatsapp
      ? { label: "Escribirle por WhatsApp", url: `https://wa.me/${String(args.whatsapp).replace(/[^0-9]/g, "")}` }
      : undefined,
    footnote: "Notificación automática de AutoKing.",
  });
}

/** Gracias al prospecto — confirmación de que recibimos su solicitud. */
export function leadThanks(args: { name: string }) {
  return build("Recibimos tu solicitud 👑", {
    preheader: "Un asesor de AutoKing te contacta muy pronto.",
    heading: `¡Gracias, ${args.name}! Recibimos tu solicitud 👑`,
    paragraphs: [
      "Un asesor de AutoKing te va a contactar muy pronto para mostrarte cómo un agente de IA puede atender y agendar por tu WhatsApp, 24/7.",
      "Si querés adelantar, escribinos directo por WhatsApp y lo vemos ahora mismo.",
    ],
    cta: { label: "Escribir por WhatsApp", url: WA },
    footnote: "Recibiste este correo porque dejaste tus datos en autoking.pro.",
  });
}

/** Confirmación de demo agendada. */
export function demoConfirmed(args: { name: string; when?: string | null }) {
  return build("Tu demo de AutoKing está agendada ✅", {
    preheader: "Nos vemos en la demo.",
    heading: `¡Listo, ${args.name}! Tu demo está agendada ✅`,
    paragraphs: [
      args.when
        ? `Te esperamos el ${args.when}. Te vamos a mostrar cómo tu agente atiende y agenda solo por WhatsApp.`
        : "Coordinamos los detalles por WhatsApp y te mostramos cómo tu agente atiende y agenda solo.",
      "Si necesitás reprogramar, respondé este correo o escribinos por WhatsApp.",
    ],
    cta: { label: "Abrir WhatsApp", url: WA },
    footnote: "Recibiste este correo porque agendaste una demo con AutoKing.",
  });
}

/** El agente de un cliente ya está activo. */
export function agentReady(args: { businessName: string; assistant: string }) {
  return build(`Tu agente ${args.assistant} ya está atendiendo 👑`, {
    preheader: `El agente de ${args.businessName} está en línea.`,
    heading: `¡${args.assistant} ya está atendiendo por vos! 👑`,
    paragraphs: [
      `El agente de IA de ${args.businessName} quedó activo. Desde ahora responde precios, horarios y agenda citas por WhatsApp, 24/7.`,
      "Si querés ajustar algo (servicios, precios, tono), avisanos y lo actualizamos al instante.",
    ],
    cta: { label: "Hablar con soporte", url: WA },
    footnote: "Recibiste este correo porque tu agente de AutoKing fue activado.",
  });
}
