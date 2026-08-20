/* ============================================================
   AutoKing — Configuración central del sitio.
   Editá acá el número de WhatsApp, textos, planes y FAQs.
   ============================================================ */

/** URL pública del sitio (para SEO: canonical, sitemap, OG). Cambiá cuando
 *  conectes el dominio propio. Podés overridear con NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.autoking.pro";

/** ⚠️ TU número con código de país, sin "+" ni espacios. Ej CO: 573001234567 */
export const WHATSAPP_NUMBER = "573044643461";
export const WHATSAPP_MSG =
  "Hola AutoKing 👑 Quiero agendar una demo y que un agente de IA atienda mi negocio.";

/** Link de WhatsApp listo para usar en cualquier CTA. */
export function waHref(message: string = WHATSAPP_MSG): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Tasa de conversión USD→COP para mostrar equivalentes en pesos.
 *  ⚠️ Editá SOLO acá: es la única fuente de verdad de la conversión.
 *  Aproximada — ajustá cuando el mercado se mueva. */
export const USD_TO_COP = 4000;

/** Formatea un monto en pesos colombianos: 360000 → "$360.000". */
export function formatCop(cop: number): string {
  return `$${Math.round(cop).toLocaleString("es-CO")}`;
}

/** href + clave de traducción (namespace Nav). */
export const NAV_LINKS = [
  { href: "#problema", key: "problem" },
  { href: "#solucion", key: "solution" },
  { href: "#beneficios", key: "benefits" },
  { href: "#planes", key: "plans" },
  { href: "#faq", key: "faq" },
] as const;

export const CONTACT = {
  email: "soporte@autoking.com",
  // Redes sociales: agregar acá SOLO cuando existan perfiles reales.
  // Mientras estén vacías no se renderizan en el footer (nada de enlaces a "#").
} as const;
