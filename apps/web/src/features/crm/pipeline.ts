/**
 * El pipeline de venta de AutoKing.
 *
 * `etapa` es distinto de `status`, y la distinción importa:
 *
 *   status → de dónde vino el lead. Lo escribe el AGENTE (guardar_lead).
 *   etapa  → dónde está en la venta. Lo mueve una PERSONA.
 *
 * Se agregó una columna nueva en vez de reutilizar `status` justamente para
 * que el agente y el vendedor no se pisen: si el agente captura un lead
 * mientras vos lo movés a "propuesta", nadie pierde su cambio.
 */

export const ETAPAS = [
  {
    value: "nuevo",
    label: "Nuevo",
    ayuda: "Entró y todavía nadie lo tocó",
    color: "bg-blue/[0.12] text-blue-bright border-blue/30",
    punto: "bg-blue-bright",
  },
  {
    value: "contactado",
    label: "Contactado",
    ayuda: "Le escribimos, hubo respuesta",
    color: "bg-[rgb(255_176_32_/_0.14)] text-gold border-[rgb(255_176_32_/_0.3)]",
    punto: "bg-gold",
  },
  {
    // Va entre contactado y propuesta porque es donde de verdad se define la
    // venta: es el paso 2 del playbook (las tres preguntas antes del
    // discurso). Un lead que nunca llegó acá no se perdió por precio.
    value: "diagnostico",
    label: "Diagnóstico",
    ayuda: "Sabemos qué negocio tiene y cuánto pierde hoy",
    color: "bg-[rgb(147_112_255_/_0.14)] text-[#b39dff] border-[rgb(147_112_255_/_0.3)]",
    punto: "bg-[#b39dff]",
  },
  {
    value: "propuesta",
    label: "Propuesta",
    ayuda: "Ya tiene el precio sobre la mesa",
    color: "bg-[rgb(77_139_255_/_0.16)] text-blue-bright border-blue-bright/40",
    punto: "bg-blue",
  },
  {
    value: "ganado",
    label: "Ganado",
    ayuda: "Cerró y es cliente",
    color: "bg-[rgb(43_212_123_/_0.14)] text-success border-[rgb(43_212_123_/_0.3)]",
    punto: "bg-success",
  },
  {
    value: "perdido",
    label: "Perdido",
    ayuda: "No va — anotá el motivo, es lo que sirve después",
    color: "bg-white/[0.05] text-faint border-line",
    punto: "bg-faint",
  },
] as const;

export type Etapa = (typeof ETAPAS)[number]["value"];

/** Las que cuentan como embudo abierto: ni ganadas ni perdidas. */
export const ETAPAS_ABIERTAS: Etapa[] = ["nuevo", "contactado", "diagnostico", "propuesta"];

export function etapaInfo(value: string) {
  return ETAPAS.find((e) => e.value === value) ?? ETAPAS[0];
}

/**
 * Hace cuánto que está frenado. Un lead en "propuesta" hace tres semanas no
 * es lo mismo que uno de ayer, y la lista no lo muestra si solo ordena por
 * fecha de creación.
 */
export function diasEnEtapa(etapaDesde: string | null | undefined): number {
  if (!etapaDesde) return 0;
  const ms = Date.now() - new Date(etapaDesde).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** A partir de cuántos días conviene mirar un lead abierto. */
export const DIAS_FRENADO = 7;

export type LeadCrm = {
  id: string;
  name: string;
  business: string | null;
  whatsapp: string | null;
  email: string | null;
  message: string | null;
  source: string;
  status: string;
  etapa: string;
  etapa_desde: string;
  motivo_perdida: string | null;
  valor_estimado: number | null;
  agente_id: string | null;
  created_at: string;
};

export type Nota = {
  id: string;
  whatsapp: string;
  cuerpo: string;
  autor_nombre: string | null;
  created_at: string;
};
