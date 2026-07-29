"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";
import { refreshPersona } from "@/lib/control";

export type NegocioState = { ok?: boolean; error?: string; aviso?: string };

/**
 * Guarda la persona del agente y la vuelve a aplicar en el runtime.
 *
 * Se guarda primero en la base y después se regenera el prompt en el VPS. Si el
 * VPS falla, los datos NO se pierden: el cliente ve un aviso de que tarda unos
 * minutos, en vez de tener que volver a escribir todo.
 */
export async function guardarNegocio(_prev: NegocioState, fd: FormData): Promise<NegocioState> {
  const agente = await miAgente();
  if (!agente) return { error: "No encontré tu agente." };

  const txt = (k: string) => String(fd.get(k) ?? "").trim() || null;
  const datos = {
    negocio_nombre: txt("negocio_nombre"),
    industria: txt("industria"),
    asistente: txt("asistente"),
    emoji: txt("emoji"),
    servicios: txt("servicios"),
    horario: txt("horario"),
    ubicacion: txt("ubicacion"),
    tono: txt("tono"),
    notas_negocio: txt("notas_negocio"),
  };
  if (!datos.negocio_nombre) return { error: "Poné el nombre de tu negocio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("agentes")
    .update({ ...datos, updated_at: new Date().toISOString() })
    .eq("id", agente.id);
  if (error) return { error: error.message };

  revalidatePath("/panel/negocio");

  if (!agente.slug) return { ok: true };
  try {
    const { data: chunks } = await supabase
      .from("knowledge_base")
      .select("titulo, contenido")
      .eq("agente_id", agente.id);

    await refreshPersona(agente.slug, {
      negocio: datos.negocio_nombre,
      rubro: datos.industria ?? undefined,
      asistente: datos.asistente ?? undefined,
      emoji: datos.emoji ?? undefined,
      tono: datos.tono ?? undefined,
      servicios: datos.servicios ? datos.servicios.split("\n").map((s) => s.trim()).filter(Boolean) : undefined,
      horario: datos.horario ?? undefined,
      ubicacion: datos.ubicacion ?? undefined,
      notas: datos.notas_negocio ?? undefined,
      conocimiento: (chunks ?? []) as { titulo: string | null; contenido: string }[],
    });
  } catch {
    return { ok: true, aviso: "Guardado. Tu agente va a tomar los cambios en unos minutos." };
  }

  return { ok: true };
}
