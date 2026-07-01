/* ============================================================
   AutoKing — Configuración central del sitio.
   Editá acá el número de WhatsApp, textos, planes y FAQs.
   ============================================================ */

/** ⚠️ TU número con código de país, sin "+" ni espacios. Ej MX: 5215512345678 */
export const WHATSAPP_NUMBER = "521XXXXXXXXXX";
export const WHATSAPP_MSG =
  "Hola AutoKing 👑 Quiero agendar una demo y que un agente de IA atienda mi negocio.";

/** Link de WhatsApp listo para usar en cualquier CTA. */
export function waHref(message: string = WHATSAPP_MSG): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const NAV_LINKS = [
  { href: "#problema", label: "El problema" },
  { href: "#solucion", label: "Cómo funciona" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#planes", label: "Planes" },
  { href: "#faq", label: "FAQ" },
] as const;

export const CONTACT = {
  email: "hola@autoking.ai",
  instagram: "#",
  facebook: "#",
  linkedin: "#",
} as const;
