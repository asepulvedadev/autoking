"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";

export type AgendaState = { ok?: boolean; error?: string };

async function ctx() {
  const agente = await miAgente();
  if (!agente) throw new Error("No encontré tu agente.");
  return { agente, supabase: await createClient() };
}

// ---------- Servicios ----------

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export async function guardarServicio(_prev: AgendaState, fd: FormData): Promise<AgendaState> {
  const nombre = String(fd.get("nombre") ?? "").trim();
  const duracion = Number(fd.get("duracion_min") ?? 30);
  const precio = String(fd.get("precio") ?? "").replace(/[^0-9.]/g, "");
  if (!nombre) return { error: "Poné el nombre del servicio." };
  if (!Number.isFinite(duracion) || duracion < 5 || duracion > 480)
    return { error: "La duración va entre 5 y 480 minutos." };

  const { agente, supabase } = await ctx();
  const { error } = await supabase.from("servicios").upsert(
    {
      agente_id: agente.id,
      slug: slugify(nombre),
      nombre,
      duracion_min: duracion,
      precio: precio ? Number(precio) : null,
      activo: true,
    },
    { onConflict: "agente_id,slug" },
  );
  if (error) return { error: error.message };

  revalidatePath("/panel/agenda");
  return { ok: true };
}

export async function borrarServicio(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const { agente, supabase } = await ctx();
  await supabase.from("servicios").delete().eq("id", id).eq("agente_id", agente.id);
  revalidatePath("/panel/agenda");
}

// ---------- Horario de atención ----------

export async function guardarHorario(_prev: AgendaState, fd: FormData): Promise<AgendaState> {
  const dia = Number(fd.get("dia_semana") ?? -1);
  const abre = String(fd.get("abre") ?? "");
  const cierra = String(fd.get("cierra") ?? "");
  if (dia < 0 || dia > 6) return { error: "Elegí un día." };
  if (!abre || !cierra) return { error: "Poné la hora de apertura y de cierre." };
  if (cierra <= abre) return { error: "La hora de cierre tiene que ser después de la de apertura." };

  const { agente, supabase } = await ctx();
  const { error } = await supabase
    .from("horarios_atencion")
    .insert({ agente_id: agente.id, dia_semana: dia, abre, cierra, activo: true });
  if (error) {
    return { error: /duplicate/i.test(error.message) ? "Ya existe una franja que arranca a esa hora ese día." : error.message };
  }

  revalidatePath("/panel/agenda");
  return { ok: true };
}

export async function borrarHorario(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const { agente, supabase } = await ctx();
  await supabase.from("horarios_atencion").delete().eq("id", id).eq("agente_id", agente.id);
  revalidatePath("/panel/agenda");
}

// ---------- Citas ----------

/** Cancela una cita. No se borra: cancelada deja rastro y libera el turno. */
export async function cancelarCita(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const { agente, supabase } = await ctx();
  await supabase
    .from("citas")
    .update({ estado: "cancelada", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agente_id", agente.id);
  revalidatePath("/panel/agenda");
}
