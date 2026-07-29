"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extraerTextoImagen } from "@/lib/control";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";

export type RecursoState = { ok?: boolean; error?: string };

const BUCKET = "catalogo";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
}

async function guard() {
  const me = await getSessionProfile();
  return me && isPrivileged(me.role) ? me : null;
}

/** El agente dueño del creativo. Sin UUID válido no se sube nada: un asset sin
 *  agente sería visible para todos, que es justo lo que queremos evitar. */
function agenteDe(formData: FormData): string | null {
  const raw = String(formData.get("agenteId") ?? "").trim();
  return UUID_RE.test(raw) ? raw : null;
}

/**
 * Sube un recurso (imagen/PDF/texto) que ESTE agente puede enviar por chat.
 * Se guarda scopeado al tenant. Opcional: OCR/texto → conocimiento del mismo tenant.
 */
export async function subirRecurso(_prev: RecursoState, formData: FormData): Promise<RecursoState> {
  const me = await guard();
  if (!me) return { error: "No autorizado." };
  // Esta acción escribe con service role (necesita Storage), así que el default
  // app.tenant_actual() de Postgres NO aplica: acá no hay auth.uid(). El tenant
  // va explícito desde la sesión, o no se escribe nada.
  if (!me.tenantId) return { error: "No se pudo determinar el tenant activo." };

  const agenteId = agenteDe(formData);
  if (!agenteId) return { error: "No pude determinar de qué agente es este creativo." };
  const file = formData.get("file") as File | null;
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || nombre);
  const aprender = String(formData.get("aprender") ?? "") === "on";
  const agentId = String(formData.get("agentId") ?? "");

  if (!file || file.size === 0) return { error: "Elegí un archivo." };
  if (!nombre) return { error: "Poné un nombre." };
  if (!slug) return { error: "El id (slug) no puede quedar vacío." };
  if (file.size > 8 * 1024 * 1024) return { error: "Máximo 8 MB." };

  const esImagen = file.type.startsWith("image/");
  const esPdf = file.type === "application/pdf";
  const esTexto = file.type.startsWith("text/");
  if (!esImagen && !esPdf && !esTexto) return { error: "Solo imágenes, PDF o texto." };

  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : esImagen ? "png" : "bin";
  // Namespaced por tenant en storage para que dos agentes no colisionen. King (null) va a la raíz (compat).
  // Namespaced por AGENTE en el storage: dos agentes pueden tener un creativo
  // con el mismo slug (ej. "planes") sin pisarse el archivo.
  const storagePath = `${agenteId}/${slug}.${ext}`;
  const admin = createAdminClient();

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, await file.arrayBuffer(), { contentType: file.type, upsert: true });
  if (upErr) return { error: `No se pudo subir: ${upErr.message}` };

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  const url = pub.publicUrl;
  const tipo = esImagen ? "imagen" : esPdf ? "documento" : "texto";

  const { error: dbErr } = await admin
    .from("agente_assets")
    .upsert({ tenant_id: me.tenantId, agente_id: agenteId, slug, nombre, descripcion: descripcion || null, tipo, url, activo: true },
      { onConflict: "agente_id,slug" });
  if (dbErr) {
    await admin.from("agente_assets")
      .update({ nombre, descripcion: descripcion || null, tipo, url, activo: true })
      .eq("slug", slug).eq("agente_id", agenteId);
  }

  if (aprender) {
    let texto = "";
    if (esImagen) {
      try { texto = await extraerTextoImagen(Buffer.from(await file.arrayBuffer()).toString("base64"), file.type); } catch { /* */ }
    } else if (esTexto) {
      texto = await file.text();
    }
    if (texto.trim()) {
      const supabase = await createClient();
      const { data: emb } = await supabase.functions.invoke("embed", { body: { text: `${nombre}. ${texto.slice(0, 3000)}` } });
      if (Array.isArray(emb?.embedding)) {
        // El conocimiento que sale de un creativo es PROPIO de ese agente,
        // no de la base compartida: por eso lleva agente_id.
        await admin.from("knowledge_base").insert({
          tenant_id: me.tenantId, agente_id: agenteId, category: "recursos", titulo: nombre,
          contenido: texto.slice(0, 3000), embedding: `[${emb.embedding.join(",")}]`, activo: true,
        });
      }
    }
  }

  if (agentId) revalidatePath(`/admin/agentes/${agentId}`);
  return { ok: true };
}

export async function toggleRecurso(formData: FormData) {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const activo = String(formData.get("activo") ?? "") === "true";
  const agentId = String(formData.get("agentId") ?? "");
  const admin = createAdminClient();
  await admin.from("agente_assets").update({ activo, updated_at: new Date().toISOString() }).eq("id", id);
  if (agentId) revalidatePath(`/admin/agentes/${agentId}`);
}

export async function eliminarRecurso(formData: FormData) {
  if (!(await guard())) return;
  const id = String(formData.get("id") ?? "");
  const agentId = String(formData.get("agentId") ?? "");
  const admin = createAdminClient();
  await admin.from("agente_assets").delete().eq("id", id);
  if (agentId) revalidatePath(`/admin/agentes/${agentId}`);
}
