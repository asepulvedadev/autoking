"use server";

import { revalidatePath } from "next/cache";
import { agenteAccesible, miAgente } from "@/lib/agentes";
import { guardarDocumento, borrarDocumento } from "@/lib/documentos";
import { convertirDocumento, extraerTextoImagen } from "@/lib/control";

export type DocState = { ok?: boolean; error?: string; detalle?: string };

/**
 * Acciones de documentos, compartidas por /admin y /panel.
 *
 * El agente NUNCA sale del formulario: si viene `agentSlug` se valida contra los
 * agentes accesibles del usuario; si no viene, se usa el del cliente logueado.
 * Un id de agente que viaja en el form es un id que se puede editar desde el
 * navegador.
 */
async function resolverAgente(fd: FormData) {
  const slug = String(fd.get("agentSlug") ?? "").trim();
  const a = slug ? await agenteAccesible(slug) : await miAgente();
  return a;
}

/** Ruta a revalidar según desde dónde se usó. */
function rutas(fd: FormData) {
  const slug = String(fd.get("agentSlug") ?? "").trim();
  return slug ? [`/admin/agentes/${slug}`] : ["/panel/conocimiento", "/panel"];
}

export async function crearOEditarDocumento(_prev: DocState, fd: FormData): Promise<DocState> {
  const agente = await resolverAgente(fd);
  if (!agente) return { error: "No encontré el agente." };

  const r = await guardarDocumento({
    agenteId: agente.id,
    titulo: String(fd.get("titulo") ?? ""),
    contenidoMd: String(fd.get("contenido_md") ?? ""),
    origen: "manual",
    documentoId: String(fd.get("documentoId") ?? "") || null,
  });
  if (!r.ok) return { error: r.error };

  for (const p of rutas(fd)) revalidatePath(p);
  return { ok: true, detalle: `Guardado. El agente lo consulta en ${r.chunks} fragmento(s).` };
}

/**
 * Sube un archivo, lo convierte a markdown y lo guarda como documento editable.
 * PDF → pdftotext · imagen → OCR · texto → tal cual.
 */
export async function subirComoDocumento(_prev: DocState, fd: FormData): Promise<DocState> {
  const agente = await resolverAgente(fd);
  if (!agente) return { error: "No encontré el agente." };

  const file = fd.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Elegí un archivo." };
  if (file.size > 20 * 1024 * 1024) return { error: "El archivo supera 20 MB." };

  const buf = Buffer.from(await file.arrayBuffer());
  const esImagen = file.type.startsWith("image/");
  let markdown: string;
  let origen: "pdf" | "imagen" | "texto" = "texto";

  try {
    if (esImagen) {
      // Una foto de la carta o de la lista de precios: se le saca el texto.
      const texto = await extraerTextoImagen(buf.toString("base64"), file.type);
      if (!texto.trim()) return { error: "No encontré texto en la imagen. Probá con una foto más nítida." };
      markdown = `# ${file.name.replace(/\.[^.]+$/, "")}\n\n${texto}`;
      origen = "imagen";
    } else {
      const r = await convertirDocumento(file.name, buf.toString("base64"));
      markdown = r.markdown;
      origen = r.origen === "pdf" ? "pdf" : "texto";
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  const r = await guardarDocumento({
    agenteId: agente.id,
    titulo: String(fd.get("titulo") ?? "").trim() || file.name.replace(/\.[^.]+$/, ""),
    contenidoMd: markdown,
    origen,
  });
  if (!r.ok) return { error: r.error };

  for (const p of rutas(fd)) revalidatePath(p);
  return {
    ok: true,
    detalle: `Convertido a markdown y guardado en ${r.chunks} fragmento(s). Podés editarlo cuando quieras.`,
  };
}

export async function eliminarDocumento(fd: FormData) {
  const agente = await resolverAgente(fd);
  if (!agente) return;
  await borrarDocumento(String(fd.get("documentoId") ?? ""), agente.id);
  for (const p of rutas(fd)) revalidatePath(p);
}
