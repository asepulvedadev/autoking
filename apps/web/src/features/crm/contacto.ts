import { createClient } from "@/lib/supabase/server";
import type { Nota } from "./pipeline";

/**
 * Todo lo que sabemos de una persona, en una sola consulta.
 *
 * El problema que resuelve: hoy los datos de un contacto están repartidos en
 * cuatro tablas y para reconstruir su historia hay que abrir cuatro pantallas
 * y cruzarlas a mano. Cuando alguien pregunta "¿este ya vino?", nadie sabe.
 *
 * Todo se ancla por WHATSAPP y no por `lead_id`: es el único identificador
 * que sobrevive cuando la misma persona pasa de lead a cliente. Si atás el
 * historial al lead, el día que se convierte en cliente perdés todo lo
 * anterior.
 */

export type Cita = {
  id: string;
  inicio: string;
  fin: string;
  estado: string;
  recurso: string | null;
  notas: string | null;
};

export type Seguimiento = {
  id: string;
  motivo: string;
  contexto: string | null;
  programado: string;
  estado: string;
  intentos: number;
};

export type ClienteRel = {
  id: string;
  business_name: string | null;
  plan: string | null;
  status: string | null;
};

export type HistorialContacto = {
  notas: Nota[];
  citas: Cita[];
  seguimientos: Seguimiento[];
  cliente: ClienteRel | null;
};

/** Normaliza a solo dígitos: cada tabla lo guarda con formato distinto. */
export function normalizarWhatsapp(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

export async function historialDeContacto(
  whatsapp: string | null | undefined,
): Promise<HistorialContacto> {
  const wa = normalizarWhatsapp(whatsapp);
  const vacio: HistorialContacto = { notas: [], citas: [], seguimientos: [], cliente: null };
  if (!wa) return vacio;

  const supabase = await createClient();

  // En paralelo: son cuatro consultas independientes y encadenarlas
  // multiplicaría la latencia de la página por cuatro sin ninguna razón.
  const [notas, citas, seguimientos, cliente] = await Promise.all([
    supabase
      .from("notas")
      .select("id,whatsapp,cuerpo,autor_nombre,created_at")
      .eq("whatsapp", wa)
      .order("created_at", { ascending: false }),
    supabase
      .from("citas")
      .select("id,inicio,fin,estado,recurso,notas")
      .eq("cliente_whatsapp", wa)
      .order("inicio", { ascending: false })
      .limit(20),
    supabase
      .from("seguimientos")
      .select("id,motivo,contexto,programado,estado,intentos")
      .eq("whatsapp", wa)
      .order("programado", { ascending: false })
      .limit(20),
    supabase
      .from("clientes")
      .select("id,business_name,plan,status")
      .eq("whatsapp", wa)
      .maybeSingle(),
  ]);

  // Sin `throw`: que falte una cita no debe dejar la ficha en blanco. Cada
  // bloque se muestra con lo que haya.
  return {
    notas: (notas.data ?? []) as Nota[],
    citas: (citas.data ?? []) as Cita[],
    seguimientos: (seguimientos.data ?? []) as Seguimiento[],
    cliente: (cliente.data ?? null) as ClienteRel | null,
  };
}
