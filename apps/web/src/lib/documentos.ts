import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Documentos = la fuente EDITABLE del RAG.
 *
 * El modelo tiene dos capas y el orden importa:
 *   agente_documentos  → el .md completo. Es lo que se lee, se edita y se borra.
 *   knowledge_base     → los chunks + embeddings. Son DERIVADOS.
 *
 * Nunca se editan los chunks a mano: se edita el documento y se regeneran. Un
 * chunk es un pedazo sin contexto — tocarlo suelto deja el conocimiento
 * inconsistente con su fuente, y nadie se entera hasta que el agente responde mal.
 */

export type Documento = {
  id: string;
  titulo: string;
  slug: string;
  contenido_md: string;
  origen: string;
  archivo_url: string | null;
  chunks: number;
  activo: boolean;
  updated_at: string;
};

export function slugificar(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || `doc-${Date.now().toString(36)}`
  );
}

/**
 * Corta el markdown en fragmentos buscables.
 *
 * Primero por encabezados (## …), porque un encabezado marca un cambio de tema
 * real; después por tamaño. Así un fragmento no mezcla "precios" con "horarios",
 * que es lo que hace que el buscador traiga ruido y el agente conteste mezclado.
 */
export function trocearMarkdown(md: string, max = 900): string[] {
  const secciones = md.split(/\n(?=#{1,3}\s)/);
  const chunks: string[] = [];

  for (const sec of secciones) {
    const limpio = sec.trim();
    if (!limpio) continue;
    if (limpio.length <= max) {
      chunks.push(limpio);
      continue;
    }
    // Sección larga: se parte por párrafos sin cruzar el límite.
    let buf = "";
    for (const p of limpio.split(/\n\s*\n/)) {
      const t = p.trim();
      if (!t) continue;
      if ((buf + "\n\n" + t).length > max && buf) {
        chunks.push(buf);
        buf = t;
      } else {
        buf = buf ? `${buf}\n\n${t}` : t;
      }
    }
    if (buf) chunks.push(buf);
  }
  return chunks.filter((c) => c.replace(/\s/g, "").length > 20).slice(0, 120);
}

async function embeber(texto: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.functions.invoke("embed", { body: { text: texto.slice(0, 800) } });
  return Array.isArray(data?.embedding) ? `[${data.embedding.join(",")}]` : null;
}

/**
 * Guarda (o actualiza) un documento y REGENERA sus chunks.
 *
 * El borrado de los chunks viejos va antes de insertar los nuevos: si se hiciera
 * al revés y algo fallara en el medio, el agente quedaría respondiendo con la
 * versión vieja y la nueva a la vez.
 */
export async function guardarDocumento(input: {
  agenteId: string;
  titulo: string;
  contenidoMd: string;
  origen?: "manual" | "pdf" | "imagen" | "texto" | "web";
  archivoUrl?: string | null;
  documentoId?: string | null;
}): Promise<{ ok: true; documentoId: string; chunks: number } | { ok: false; error: string }> {
  const { agenteId, titulo, contenidoMd } = input;
  if (!titulo.trim()) return { ok: false, error: "Poné un título." };
  if (!contenidoMd.trim()) return { ok: false, error: "El documento está vacío." };
  if (contenidoMd.length > 200_000) return { ok: false, error: "El documento supera 200.000 caracteres." };

  const supabase = await createClient();
  const slug = slugificar(titulo);

  const { data: doc, error: eDoc } = await supabase
    .from("agente_documentos")
    .upsert(
      {
        ...(input.documentoId ? { id: input.documentoId } : {}),
        agente_id: agenteId,
        titulo: titulo.trim(),
        slug,
        contenido_md: contenidoMd,
        origen: input.origen ?? "manual",
        archivo_url: input.archivoUrl ?? null,
        activo: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: input.documentoId ? "id" : "agente_id,slug" },
    )
    .select("id")
    .single();

  if (eDoc || !doc) return { ok: false, error: eDoc?.message ?? "No pude guardar el documento." };

  // Fuera los chunks viejos ANTES de generar los nuevos.
  await supabase.from("knowledge_base").delete().eq("documento_id", doc.id);

  const partes = trocearMarkdown(contenidoMd);
  let ok = 0;
  for (const [i, contenido] of partes.entries()) {
    const t = `${titulo} (${i + 1}/${partes.length})`;
    const embedding = await embeber(`${t}. ${contenido}`);
    if (!embedding) continue;
    const { error } = await supabase.from("knowledge_base").insert({
      agente_id: agenteId,
      documento_id: doc.id,
      category: input.origen ?? "documento",
      titulo: t,
      contenido,
      embedding,
      activo: true,
    });
    if (!error) ok++;
  }

  await supabase.from("agente_documentos").update({ chunks: ok }).eq("id", doc.id);
  return { ok: true, documentoId: doc.id, chunks: ok };
}

/** Borra el documento; sus chunks se van solos por ON DELETE CASCADE. */
export async function borrarDocumento(documentoId: string, agenteId: string) {
  const supabase = await createClient();
  await supabase.from("agente_documentos").delete().eq("id", documentoId).eq("agente_id", agenteId);
}

export async function listarDocumentos(agenteId: string): Promise<Documento[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agente_documentos")
    .select("id, titulo, slug, contenido_md, origen, archivo_url, chunks, activo, updated_at")
    .eq("agente_id", agenteId)
    .order("updated_at", { ascending: false });
  return (data ?? []) as Documento[];
}
