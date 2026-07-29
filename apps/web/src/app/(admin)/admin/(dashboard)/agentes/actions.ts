"use server";

import { revalidatePath } from "next/cache";
import { crearPackage, actualizarHerramientas, actualizarPersona } from "@/lib/control";
import { chatAgent } from "@/lib/agents-bridge";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";

/** QA del agente demo por inferencia (lo usa AgentChat en la ficha del cliente). */
export async function testChat(agentId: string, message: string, session: string): Promise<{ reply?: string; error?: string }> {
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) return { error: "No autorizado." };
  try {
    const reply = await chatAgent(agentId, message, session);
    return { reply };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export type AgenteState = { ok?: boolean; error?: string; agentId?: string; detalle?: string };

/** Guarda la identidad (IDENTITY/SOUL/AGENTS) del agente. */
export async function guardarIdentidadAction(_prev: AgenteState, formData: FormData): Promise<AgenteState> {
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) return { error: "Solo un administrador puede editar agentes." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Agente inválido." };

  const campo = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : undefined;
  };

  try {
    const r = await actualizarPersona(id, {
      identity: campo("identity"),
      soul: campo("soul"),
      instructions: campo("instructions"),
    });
    revalidatePath(`/admin/agentes/${id}`);
    const esp = (r as { espejado?: string | null }).espejado;
    return { ok: true, detalle: esp ? "(también aplicado al agente en vivo)" : "" };
  } catch (e) {
    return { error: `No se pudo guardar: ${(e as Error).message}` };
  }
}

/** Crear un AgentPackage nuevo. Solo administrador/dev: crea infraestructura de agente. */
export async function crearAgenteAction(_prev: AgenteState, formData: FormData): Promise<AgenteState> {
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) return { error: "Solo un administrador puede crear agentes." };

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const negocio = str("negocio");
  if (!negocio) return { error: "El nombre del negocio es obligatorio." };

  try {
    const r = await crearPackage({
      negocio,
      slug: str("slug") || undefined,
      rubro: str("rubro") || undefined,
      asistente: str("asistente") || undefined,
      emoji: str("emoji") || undefined,
      horario: str("horario") || undefined,
      ubicacion: str("ubicacion") || undefined,
      servicios: str("servicios").split("\n").map((s) => s.trim()).filter(Boolean),
      tenantId: str("tenantId") || undefined,
    });
    revalidatePath("/admin/agentes");
    return { ok: true, agentId: r.agentId };
  } catch (e) {
    return { error: `No se pudo crear: ${(e as Error).message}` };
  }
}

/** Cambiar el permiso de una herramienta del agente (allow + confirmación). */
export async function actualizarHerramientaAction(formData: FormData) {
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) return;

  const id = String(formData.get("id") ?? "");
  const tool = String(formData.get("tool") ?? "");
  const allow = String(formData.get("allow") ?? "") === "true";
  const confirmation = String(formData.get("confirmation") ?? "never");
  // `tenant` acota la herramienta a los datos de su tenant. Es el default a
  // propósito: `global` la deja operar sin esa frontera, y eso solo tiene
  // sentido en casos puntuales y conscientes.
  const scope = String(formData.get("scope") ?? "tenant") === "global" ? "global" : "tenant";
  if (!id || !tool) return;

  try {
    await actualizarHerramientas(id, { [tool]: allow ? { allow: true, confirmation, scope } : null });
  } catch {
    /* el error se refleja al recargar: la lista muestra el estado real del VPS */
  }
  revalidatePath(`/admin/agentes/${id}`);
}
