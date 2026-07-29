"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";

export type InternoState = { ok?: boolean; error?: string };

/**
 * Información interna del agente.
 *
 * ⚠️ ENTENDER ESTO ANTES DE USARLO: el agente CONOCE lo que se carga acá. Se le
 * instruye no revelarlo y se refuerza con el chequeo de rol (solo lo comparte
 * con quien `identificar_contacto` reconozca como equipo), pero **una
 * instrucción no es un candado técnico**. Con el prompt correcto, un tercero
 * podría sacárselo.
 *
 * Por eso: acá va información sensible del NEGOCIO (márgenes, políticas
 * internas, hasta cuánto descuento se puede dar). NUNCA credenciales, API keys
 * ni contraseñas — eso va en el servidor, fuera del alcance del modelo.
 */

async function ctx() {
  const agente = await miAgente();
  if (!agente) throw new Error("No encontré tu agente.");
  return { agente, supabase: await createClient() };
}

export async function guardarInterno(_prev: InternoState, fd: FormData): Promise<InternoState> {
  const clave = String(fd.get("clave") ?? "").trim();
  const valor = String(fd.get("valor") ?? "").trim();
  const descripcion = String(fd.get("descripcion") ?? "").trim();
  const visibilidad = String(fd.get("visibilidad") ?? "equipo");

  if (!clave) return { error: "Poné un nombre para identificarlo." };
  if (!valor) return { error: "Falta el contenido." };
  if (!["equipo", "nunca"].includes(visibilidad)) return { error: "Visibilidad inválida." };

  // Barrera de sentido común: si parece una credencial, no va acá.
  if (/^(sk-|pk_|ghp_|xox[baprs]-|AKIA|eyJ[A-Za-z0-9_-]{10,})/.test(valor)) {
    return {
      error:
        "Eso parece una credencial o API key. No la guardes acá: el agente puede leer esta sección. Pasánosla por otro medio y la ponemos en el servidor.",
    };
  }

  const { agente, supabase } = await ctx();
  const { error } = await supabase.from("agente_secretos").upsert(
    { agente_id: agente.id, clave, valor, descripcion: descripcion || null, visibilidad, activo: true },
    { onConflict: "agente_id,clave" },
  );
  if (error) return { error: error.message };

  revalidatePath("/panel/interno");
  return { ok: true };
}

export async function borrarInterno(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const { agente, supabase } = await ctx();
  await supabase.from("agente_secretos").delete().eq("id", id).eq("agente_id", agente.id);
  revalidatePath("/panel/interno");
}
