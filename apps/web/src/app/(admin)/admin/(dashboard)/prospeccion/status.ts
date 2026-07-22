// Tipos y estilos de estado para prospectos (prospección Google Maps → propuesta).

export type Prospect = {
  id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  has_website: boolean;
  rating: number | null;
  reviews: number;
  address: string | null;
  maps_url: string | null;
  need_score: number;
  status: ProspectStatus;
  source: string;
  created_at: string;
};

export type ProspectStatus =
  | "nuevo"
  | "calificado"
  | "contactado"
  | "respondio"
  | "cliente"
  | "descartado";

export const PROSPECT_STATUSES: ProspectStatus[] = [
  "nuevo",
  "calificado",
  "contactado",
  "respondio",
  "cliente",
  "descartado",
];

const LABELS: Record<ProspectStatus, string> = {
  nuevo: "Nuevo",
  calificado: "Calificado",
  contactado: "Contactado",
  respondio: "Respondió",
  cliente: "Cliente",
  descartado: "Descartado",
};

export const PROSPECT_STATUS_STYLES: Record<ProspectStatus, string> = {
  nuevo: "border-[var(--line-strong)] text-[var(--color-muted)]",
  calificado: "border-blue-bright/40 text-blue-bright",
  contactado: "border-amber-400/40 text-amber-300",
  respondio: "border-emerald-400/40 text-emerald-300",
  cliente: "border-emerald-500/60 text-emerald-400 bg-emerald-500/10",
  descartado: "border-[var(--line)] text-[var(--color-faint)]",
};

export function prospectStatusLabel(s: string): string {
  return LABELS[s as ProspectStatus] ?? s;
}

/** Color del score de necesidad (0-100). */
export function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 45) return "text-amber-300";
  return "text-[var(--color-faint)]";
}
