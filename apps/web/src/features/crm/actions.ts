"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ETAPAS } from "./pipeline";

/**
 * Acciones del CRM.
 *
 * Todas pasan por el cliente de servidor con la sesión del usuario, así que
 * las escriben bajo RLS: un vendedor de Mayand no puede mover un lead de King
 * aunque adivine el id. No se usa `service_role` acá a propósito — la
 * frontera la pone la base, no este archivo.
 */

const VALIDAS = new Set(ETAPAS.map((e) => e.value));

export async function moverEtapa(
  leadId: string,
  etapa: string,
  motivoPerdida?: string,
): Promise<{ ok?: true; error?: string }> {
  if (!VALIDAS.has(etapa as never)) return { error: "Etapa inválida" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      etapa,
      // Se reinicia el reloj: sin esto no se puede saber cuánto lleva
      // frenado en la etapa actual, que es lo que hace útil al pipeline.
      etapa_desde: new Date().toISOString(),
      // El motivo solo tiene sentido en "perdido". Si vuelve a abrirse, se
      // limpia: dejarlo colgado confunde al que lo lea después.
      motivo_perdida: etapa === "perdido" ? (motivoPerdida?.trim() || null) : null,
    })
    .eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/agentes", "layout");
  return { ok: true };
}

export async function agregarNota(
  whatsapp: string,
  cuerpo: string,
  opts?: { leadId?: string; agenteId?: string | null },
): Promise<{ ok?: true; error?: string }> {
  const texto = cuerpo.trim();
  if (!texto) return { error: "La nota está vacía" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Sesión vencida" };

  // El nombre se guarda desnormalizado a propósito: una nota de hace un año
  // tiene que seguir diciendo quién la escribió aunque esa persona ya no esté
  // en el equipo y su fila se haya borrado.
  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  const { error } = await supabase.from("notas").insert({
    whatsapp: whatsapp.replace(/\D/g, ""),
    lead_id: opts?.leadId ?? null,
    agente_id: opts?.agenteId ?? null,
    cuerpo: texto,
    autor_id: auth.user.id,
    autor_nombre: perfil?.full_name ?? auth.user.email ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/leads/${opts?.leadId ?? ""}`);
  return { ok: true };
}

export async function borrarNota(id: string, leadId?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notas").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/admin/leads/${leadId ?? ""}`);
  return { ok: true as const };
}
