import { createClient } from "@/lib/supabase/server";

/** Rol de un contacto de WhatsApp según nuestra base. */
export type ContactRole = { rol: "equipo" | "cliente" | "lead" | "desconocido"; nombre: string | null; detalle?: string | null };

const digits = (s: string | null | undefined) => String(s ?? "").replace(/[^0-9]/g, "");

/** Construye un mapa whatsapp → rol consultando equipo, clientes y leads.
 *  Precedencia: equipo > cliente > lead. */
export async function buildRoleMap(): Promise<Map<string, ContactRole>> {
  const supabase = await createClient();
  const [equipo, clientes, leads] = await Promise.all([
    supabase.from("equipo").select("whatsapp, nombre, rol").eq("activo", true),
    supabase.from("clientes").select("whatsapp, contact_name, business_name, plan"),
    supabase.from("leads").select("whatsapp, name, status"),
  ]);

  const map = new Map<string, ContactRole>();
  for (const l of leads.data ?? []) {
    const wa = digits(l.whatsapp);
    if (wa) map.set(wa, { rol: "lead", nombre: l.name, detalle: l.status });
  }
  for (const c of clientes.data ?? []) {
    const wa = digits(c.whatsapp);
    if (wa) map.set(wa, { rol: "cliente", nombre: c.contact_name || c.business_name, detalle: c.plan });
  }
  for (const e of equipo.data ?? []) {
    const wa = digits(e.whatsapp);
    if (wa) map.set(wa, { rol: "equipo", nombre: e.nombre, detalle: e.rol });
  }
  return map;
}

export function roleFor(map: Map<string, ContactRole>, phone: string): ContactRole {
  return map.get(digits(phone)) ?? { rol: "desconocido", nombre: null };
}

export const ROLE_STYLES: Record<ContactRole["rol"], string> = {
  equipo: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  cliente: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  lead: "border-blue-bright/40 bg-blue/10 text-blue-bright",
  desconocido: "border-[var(--line)] text-[var(--color-faint)]",
};

export const ROLE_LABEL: Record<ContactRole["rol"], string> = {
  equipo: "Equipo",
  cliente: "Cliente",
  lead: "Lead",
  desconocido: "Nuevo",
};
