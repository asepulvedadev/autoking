"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { miAgente } from "@/lib/agentes";
import { extraerTextoImagen } from "@/lib/control";

export type ConocimientoState = { ok?: boolean; error?: string };

/**
 * CRUD del conocimiento del cliente.
 *
 * Todo se acota al agente resuelto de la SESIÓN, nunca a un id que venga del
 * formulario. Y la base compartida de AutoKing (agente_id null) es de solo
 * lectura acá: si el cliente pudiera borrarla, dejaría a su agente sin saber
 * cómo funciona el servicio que compró.
 */

async function contexto() {
  const agente = await miAgente();
  if (!agente) throw new Error("No encontré tu agente.");
  return { agente, supabase: await createClient() };
}

/** Genera el embedding. Sin él el chunk existe pero el agente nunca lo encuentra. */
async function embeber(texto: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.functions.invoke("embed", { body: { text: texto.slice(0, 800) } });
  return Array.isArray(data?.embedding) ? `[${data.embedding.join(",")}]` : null;
}

export async function agregarConocimiento(_prev: ConocimientoState, fd: FormData): Promise<ConocimientoState> {
  const titulo = String(fd.get("titulo") ?? "").trim();
  const contenido = String(fd.get("contenido") ?? "").trim();
  if (!contenido) return { error: "Escribe qué quieres que tu agente sepa." };
  if (contenido.length > 3000) return { error: "Es muy largo: partilo en varios (máx. 3000 caracteres)." };

  const { agente, supabase } = await contexto();
  const embedding = await embeber(`${titulo}. ${contenido}`);
  if (!embedding) return { error: "No pude procesarlo. Probá de nuevo en un momento." };

  const { error } = await supabase.from("knowledge_base").insert({
    tenant_id: null as never, // lo pone el default app.tenant_actual()
    agente_id: agente.id,
    category: "cliente",
    titulo: titulo || "Sin título",
    contenido,
    embedding,
    activo: true,
  });
  if (error) return { error: error.message };

  revalidatePath("/panel/conocimiento");
  return { ok: true };
}

export async function editarConocimiento(_prev: ConocimientoState, fd: FormData): Promise<ConocimientoState> {
  const id = String(fd.get("id") ?? "");
  const titulo = String(fd.get("titulo") ?? "").trim();
  const contenido = String(fd.get("contenido") ?? "").trim();
  if (!id || !contenido) return { error: "Falta el contenido." };

  const { agente, supabase } = await contexto();
  const embedding = await embeber(`${titulo}. ${contenido}`);
  if (!embedding) return { error: "No pude procesarlo. Probá de nuevo." };

  // El .eq("agente_id") no es redundante con RLS: deja la intención escrita y
  // evita tocar la base compartida aunque llegue un id que no corresponde.
  const { error } = await supabase
    .from("knowledge_base")
    .update({ titulo: titulo || "Sin título", contenido, embedding, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("agente_id", agente.id);
  if (error) return { error: error.message };

  revalidatePath("/panel/conocimiento");
  return { ok: true };
}

export async function borrarConocimiento(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const { agente, supabase } = await contexto();
  await supabase.from("knowledge_base").delete().eq("id", id).eq("agente_id", agente.id);
  revalidatePath("/panel/conocimiento");
}

/**
 * Trocea un texto largo en fragmentos que el buscador semántico pueda usar.
 *
 * Se corta por párrafos y se agrupa hasta ~700 caracteres. Ni muy chico (pierde
 * contexto y el agente responde a medias) ni muy grande (la búsqueda deja de
 * ser precisa y trae ruido).
 */
function trocear(texto: string, max = 700): string[] {
  const parrafos = texto.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of parrafos) {
    if ((buf + " " + p).length > max && buf) {
      chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf} ${p}` : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

/**
 * Entrenamiento rápido: subís un archivo y el agente lo aprende.
 *
 * Acepta texto (.txt/.md), y fotos — a una foto de tu carta o tu lista de
 * precios le saca el texto con OCR. Es la vía más rápida para pasar de "no sabe
 * nada" a "sabe todo lo tuyo": en vez de escribir 20 fragmentos a mano, subís
 * el documento que ya tenés.
 */
export async function subirDocumento(_prev: ConocimientoState, fd: FormData): Promise<ConocimientoState> {
  const file = fd.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Elegí un archivo." };

  const esImagen = file.type.startsWith("image/");
  const limite = esImagen ? 8 * 1024 * 1024 : 512 * 1024;
  if (file.size > limite)
    return { error: esImagen ? "La imagen es muy grande (máx 8 MB)." : "El archivo es muy grande (máx 512 KB)." };

  let texto: string;
  if (esImagen) {
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    try {
      texto = await extraerTextoImagen(b64, file.type);
    } catch {
      return { error: "No pude leer la imagen. Probá con una foto más nítida." };
    }
    if (!texto.trim()) return { error: "No encontré texto en la imagen." };
  } else if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
    texto = await file.text();
  } else {
    return { error: "Por ahora acepto texto (.txt, .md) o fotos. Un PDF: pasalo a texto o sacale una foto." };
  }

  const partes = trocear(texto).slice(0, 40);
  if (!partes.length) return { error: "El archivo no tenía texto." };

  const { agente, supabase } = await contexto();
  const base = file.name.replace(/\.[^.]+$/, "").slice(0, 60);

  let ok = 0;
  for (const [i, contenido] of partes.entries()) {
    const titulo = `${base} (${i + 1}/${partes.length})`;
    const embedding = await embeber(`${titulo}. ${contenido}`);
    if (!embedding) continue;
    const { error } = await supabase.from("knowledge_base").insert({
      agente_id: agente.id,
      category: "documento",
      titulo,
      contenido,
      embedding,
      activo: true,
    });
    if (!error) ok++;
  }

  revalidatePath("/panel/conocimiento");
  return ok
    ? { ok: true }
    : { error: "No pude procesar el documento. Probá de nuevo en un momento." };
}
