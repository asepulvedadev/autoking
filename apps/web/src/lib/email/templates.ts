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

/** Propuesta en frío a un prospecto descubierto (Google Maps → prospección).
 *  Incluye beneficios, precios y opt-out (BAJA) para cumplir Habeas Data (Ley 1581/2012). */
export function proposalOutreach(args: { businessName: string; category?: string | null; city?: string | null }) {
  const nombre = args.businessName;
  const rubro = args.category ? (String(args.category).split(",")[0] ?? "").trim() : "negocio";
  const waMsg = encodeURIComponent(
    `Hola, soy de ${nombre}. Vi la propuesta de AutoKing y quiero saber más sobre el agente para mi negocio.`,
  );
  const ctaUrl = `${WA}?text=${waMsg}`;

  const benefits = [
    "Responde al instante, a cualquier hora — nunca dejás a un cliente esperando.",
    "Agenda citas y cotiza solo, directo en tu WhatsApp de siempre.",
    "Contesta las mismas preguntas de siempre por vos (precios, horarios, ubicación).",
    "Listo en días, sin apps nuevas ni cambiar cómo trabajás.",
  ];
  const benefitsHtml =
    `<p style="margin:20px 0 6px;font-size:13px;font-weight:800;color:#7fd0ff;text-transform:uppercase;letter-spacing:.5px;">Qué hace por vos</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    benefits
      .map(
        (t) =>
          `<tr><td style="padding:6px 0;vertical-align:top;width:26px;color:#1e6bff;font-size:15px;">✓</td>` +
          `<td style="padding:6px 0;font-size:14.5px;line-height:1.55;color:#9fb4cc;">${escRow(t)}</td></tr>`,
      )
      .join("") +
    `</table>`;

  const planes = [
    { name: "Básico", price: "$90", desc: "Responde y agenda por WhatsApp 24/7.", best: false },
    { name: "Pro", price: "$150", desc: "+ calendario y seguimiento de clientes.", best: true },
    { name: "Imperio", price: "$250", desc: "+ multicanal y configuración completa.", best: false },
  ];
  const pricingHtml =
    `<p style="margin:22px 0 6px;font-size:13px;font-weight:800;color:#7fd0ff;text-transform:uppercase;letter-spacing:.5px;">Planes</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    planes
      .map((pl) => {
        const border = pl.best ? "#1e6bff" : "#1a2230";
        const tag = pl.best
          ? `<div style="font-size:10px;font-weight:800;letter-spacing:.5px;color:#1e6bff;text-transform:uppercase;margin-bottom:4px;">Recomendado</div>`
          : "";
        return `<td width="33%" valign="top" style="padding:6px;"><div style="border:1px solid ${border};border-radius:12px;padding:14px 12px;text-align:center;background:#0a0f16;">${tag}<div style="font-size:13px;font-weight:700;color:#eaf2ff;">${pl.name}</div><div style="font-size:22px;font-weight:800;color:#fff;margin:2px 0;">${pl.price}<span style="font-size:12px;color:#6b7d92;font-weight:500;"> USD/mes</span></div><div style="font-size:11.5px;line-height:1.45;color:#6b7d92;">${escRow(pl.desc)}</div></div></td>`;
      })
      .join("") +
    `</tr></table>` +
    `<p style="margin:8px 0 0;font-size:11.5px;color:#6b7d92;text-align:center;">Instalación única desde $149 USD · sin permanencia · cancelás cuando quieras.</p>`;

  return build(`${nombre}, un empleado que atiende tu WhatsApp 24/7 👑`, {
    preheader: "Un agente de IA que atiende y agenda por tu WhatsApp 24/7.",
    heading: `${nombre}: ¿cuántos clientes se te escapan por no contestar a tiempo? 👑`,
    paragraphs: [
      `Te escribimos de AutoKing. Ayudamos a negocios como ${nombre} a no perder un solo cliente: montamos un agente de inteligencia artificial que atiende, responde y agenda por WhatsApp 24/7, como un empleado que nunca duerme.`,
      `Sabemos que en un ${rubro} cada mensaje sin responder es una cita perdida. Tu agente contesta al instante, incluso de noche o cuando estás ocupado atendiendo.`,
    ],
    bodyHtml: benefitsHtml + pricingHtml,
    cta: { label: "Quiero ver una demo por WhatsApp", url: ctaUrl },
    footnote: `Recibiste este correo porque ${nombre} aparece como negocio público en Google Maps y creemos que AutoKing puede ayudarte. Si no querés recibir más, respondé BAJA y te quitamos de la lista al instante.`,
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
