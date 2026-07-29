"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";
import { toggleAgente } from "@/lib/control";

export type PanelState = { ok?: boolean; error?: string };

/**
 * Pausa o reanuda EL agente del cliente.
 *
 * Nunca recibe el id del agente por formulario: lo resuelve del lado del
 * servidor a partir de la sesión. Un id que viaja en el form es un id que se
 * puede cambiar desde el navegador — así, aunque alguien manipule el POST,
 * solo puede tocar su propio agente.
 */
export async function cambiarEstadoAgente(_prev: PanelState, formData: FormData): Promise<PanelState> {
  const agente = await miAgente();
  if (!agente) return { error: "No encontré tu agente." };

  const activar = String(formData.get("activar") ?? "") === "true";

  // Primero el runtime: si el VPS falla, la DB no debe quedar diciendo algo
  // distinto de lo que realmente está pasando en WhatsApp.
  try {
    await toggleAgente(agente.slug, activar);
  } catch (e) {
    return { error: `No pude ${activar ? "reanudar" : "pausar"} el agente: ${(e as Error).message}` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("agentes")
    .update({ estado: activar ? "activo" : "pausado", updated_at: new Date().toISOString() })
    .eq("id", agente.id);
  if (error) return { error: error.message };

  revalidatePath("/panel");
  return { ok: true };
}
