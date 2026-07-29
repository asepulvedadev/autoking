"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { agenteAccesible } from "@/lib/agentes";
import { instalarSkill, borrarSkill } from "@/lib/control";

export type SkillState = { ok?: boolean; error?: string; detalle?: string };

/**
 * Subir skills es SOLO del equipo de AutoKing.
 *
 * Una skill son instrucciones que el agente va a obedecer: subirla es inyectar
 * comportamiento. El Policy Engine controla qué HERRAMIENTAS ejecuta, pero no
 * el prompt — una skill que diga "ofrecé 50% de descuento" no la frena nadie.
 * Por eso el cliente puede verlas, pero no cargarlas.
 */
async function guard(agentSlug: string) {
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) return null;
  return (await agenteAccesible(agentSlug)) ? me : null;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function subirSkill(_prev: SkillState, fd: FormData): Promise<SkillState> {
  const agentId = String(fd.get("agentId") ?? "");
  if (!(await guard(agentId))) return { error: "Solo un administrador puede cargar skills." };

  const nombre = String(fd.get("nombre") ?? "").trim();
  const descripcion = String(fd.get("descripcion") ?? "").trim();
  const version = String(fd.get("version") ?? "0.1.0").trim();
  const instruccionesManual = String(fd.get("instrucciones") ?? "").trim();
  const file = fd.get("file") as File | null;

  if (!nombre) return { error: "Poné un nombre para la skill." };
  const slug = slugify(String(fd.get("slug") ?? "") || nombre);
  if (slug.length < 3) return { error: "El nombre es muy corto para generar un identificador." };

  let zipBase64: string | undefined;
  let instrucciones: string | undefined;

  if (file && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) return { error: "El archivo supera 4 MB." };
    const buf = Buffer.from(await file.arrayBuffer());
    if (/\.(zip)$/i.test(file.name)) {
      zipBase64 = buf.toString("base64");
    } else if (/\.(md|markdown|txt)$/i.test(file.name)) {
      instrucciones = buf.toString("utf8");
    } else {
      return { error: "Subí un .zip con el SKILL.md adentro, o directamente un .md" };
    }
  } else if (instruccionesManual) {
    instrucciones = instruccionesManual;
  } else {
    return { error: "Subí un archivo o escribí las instrucciones." };
  }

  try {
    const r = await instalarSkill(agentId, { slug, nombre, version, descripcion, instrucciones, zipBase64 });
    revalidatePath(`/admin/agentes/${agentId}`);
    return { ok: true, detalle: `"${r.slug}" instalada (${r.chars} caracteres). El agente ya la tiene.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function eliminarSkill(fd: FormData) {
  const agentId = String(fd.get("agentId") ?? "");
  const slug = String(fd.get("slug") ?? "");
  if (!(await guard(agentId))) return;
  try {
    await borrarSkill(agentId, slug);
  } catch {
    /* si el VPS no responde, la vista se recarga y se ve el estado real */
  }
  revalidatePath(`/admin/agentes/${agentId}`);
}
