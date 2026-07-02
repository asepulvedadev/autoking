export const LEAD_ESTADOS = [
  { value: "nuevo", label: "Nuevo" },
  { value: "contactado", label: "Contactado" },
  { value: "convertido", label: "Convertido" },
  { value: "descartado", label: "Descartado" },
];

export const LEAD_STATUS_STYLES: Record<string, string> = {
  nuevo: "bg-blue/[0.12] text-blue-bright border-[rgb(30_107_255_/_0.3)]",
  contactado: "bg-[rgb(255_176_32_/_0.14)] text-[var(--color-gold)] border-[rgb(255_176_32_/_0.3)]",
  convertido: "bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)] border-[rgb(43_212_123_/_0.3)]",
  descartado: "bg-white/[0.05] text-[var(--color-faint)] border-[var(--line)]",
};

export function leadStatusLabel(value: string) {
  return LEAD_ESTADOS.find((x) => x.value === value)?.label ?? value;
}

export type Lead = {
  id: string;
  name: string;
  business: string | null;
  whatsapp: string | null;
  email: string | null;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
};
