import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";

/**
 * Acceso a agentes.
 *
 * Un agente es la unidad de trabajo: adentro viven SUS leads, conversaciones,
 * prospección, creativos y conocimiento. Por eso el acceso se define acá y no
 * por ruta suelta en el sidebar.
 *
 * Reglas:
 * - Miembro con `agente_id` en su membresía → ve SOLO ese agente
 *   (el vendedor de México entra a Mayand y no ve nada de King).
 * - Miembro sin `agente_id` (staff del tenant) → ve todos los del tenant.
 */

export type AgenteAcceso = {
  id: string; // uuid en la DB — se usa para filtrar los datos
  slug: string; // 'king' | 'mayand' — se usa en la URL
  nombre: string | null;
  whatsapp_display: string | null;
  kapso_phone_number_id: string | null;
  /** internal_id del número en Kapso: separa las conversaciones de cada agente. */
  kapso_config_id: string | null;
  pais: string | null;
  estado: string;
};

const CAMPOS =
  "id, slug, nombre, whatsapp_display, kapso_phone_number_id, kapso_config_id, pais, estado";

/** Agentes que el usuario logueado tiene permitido ver. Vacío si no hay sesión. */
export async function agentesDelUsuario(): Promise<AgenteAcceso[]> {
  const me = await getSessionProfile();
  if (!me) return [];

  const supabase = await createClient();

  // Membresías del usuario: si alguna acota a un agente, mandan esas.
  const { data: membresias } = await supabase
    .from("memberships")
    .select("agente_id")
    .eq("user_id", me.id);

  const acotadas = (membresias ?? [])
    .map((m) => m.agente_id as string | null)
    .filter((x): x is string => Boolean(x));

  // Si TODAS las membresías acotan a un agente, el usuario solo ve esos.
  // Si alguna es de tenant completo (agente_id null), ve todos.
  const soloEstos = acotadas.length > 0 && acotadas.length === (membresias ?? []).length;

  let q = supabase.from("agentes").select(CAMPOS).order("created_at");
  if (soloEstos) q = q.in("id", acotadas);

  const { data } = await q;
  return (data ?? []) as AgenteAcceso[];
}

/**
 * Devuelve el agente si el usuario puede verlo, o `null`.
 * Úsalo como guard en TODA página que cuelgue de /admin/agentes/[id].
 */
export async function agenteAccesible(slug: string): Promise<AgenteAcceso | null> {
  const agentes = await agentesDelUsuario();
  return agentes.find((a) => a.slug === slug) ?? null;
}

/**
 * El agente del cliente en /panel.
 *
 * Un cliente tiene UN agente: el que contrató. Si tuviera varios (dos sedes,
 * por ejemplo) devolvemos el primero — el selector se agrega el día que exista
 * ese caso, no antes.
 */
export async function miAgente(): Promise<AgenteAcceso | null> {
  const agentes = await agentesDelUsuario();
  return agentes[0] ?? null;
}
