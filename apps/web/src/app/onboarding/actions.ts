"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshPersona, extraerTextoImagen } from "@/lib/control";

export type OnboardingState = { ok?: boolean; error?: string };

/**
 * Resuelve el cliente desde el token público. El token ES la autorización.
 *
 * Esta ruta corre con SERVICE ROLE (bypassa RLS) y sin sesión, así que el token
 * es la única barrera: se exige una longitud mínima para que un token vacío o
 * recortado no matchee nada. Todo lo que se escriba después queda anclado al
 * `tenant_id` de ESTE cliente — nunca a un default ni a un valor adivinado.
 */
async function clientePorToken(token: string) {
  if (!token || token.length < 16) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("clientes")
    .select("id, tenant_id, business_name, industry, openclaw_agent_id, asistente, emoji, servicios, horario, ubicacion, tono, notas_negocio")
    .eq("onboarding_token", token)
    .single();
  return data;
}

/** Si el cliente ya tiene agente activo, recompone su persona en el VPS (best-effort). */
async function refrescarPersona(clienteId: string) {
  const admin = createAdminClient();
  const { data: c } = await admin
    .from("clientes")
    .select("business_name, industry, openclaw_agent_id, asistente, emoji, servicios, horario, ubicacion, tono, notas_negocio")
    .eq("id", clienteId)
    .single();
  if (!c?.openclaw_agent_id) return;
  const { data: chunks } = await admin.from("knowledge_base").select("titulo, contenido").eq("cliente_id", clienteId);
  try {
    await refreshPersona(c.openclaw_agent_id as string, {
      negocio: c.business_name,
      rubro: c.industry ?? undefined,
      asistente: c.asistente ?? undefined,
      emoji: c.emoji ?? undefined,
      tono: c.tono ?? undefined,
      servicios: c.servicios ? (c.servicios as string).split("\n").map((s: string) => s.trim()).filter(Boolean) : undefined,
      horario: c.horario ?? undefined,
      ubicacion: c.ubicacion ?? undefined,
      notas: c.notas_negocio ?? undefined,
      conocimiento: (chunks ?? []) as { titulo: string | null; contenido: string }[],
    });
  } catch {
    /* best-effort */
  }
}

/** Guarda la info del negocio que el cliente carga en el formulario público. */
export async function guardarOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const token = String(formData.get("token") ?? "");
  const cli = await clientePorToken(token);
  if (!cli) return { error: "Link inválido o vencido." };

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const admin = createAdminClient();
  const { error } = await admin
    .from("clientes")
    .update({
      asistente: str("asistente") || null,
      emoji: str("emoji") || null,
      servicios: str("servicios") || null,
      horario: str("horario") || null,
      ubicacion: str("ubicacion") || null,
      tono: str("tono") || null,
      notas_negocio: str("notas_negocio") || null,
    })
    .eq("id", cli.id);
  if (error) return { error: error.message };

  await refrescarPersona(cli.id);
  revalidatePath(`/onboarding/${token}`);
  return { ok: true };
}

/**
 * Inserta un chunk de conocimiento desde el formulario público.
 * El `tenantId` viene del cliente que resolvió el token: escribe con service role,
 * o sea que el default `app.tenant_actual()` de Postgres no aplica (no hay auth.uid()).
 */
async function insertarChunk(tenantId: string, clienteId: string, titulo: string, contenido: string) {
  const admin = createAdminClient();
  const { data: emb } = await admin.functions.invoke("embed", { body: { text: `${titulo}. ${contenido}` } });
  if (!Array.isArray(emb?.embedding)) return false;
  await admin.from("knowledge_base").insert({
    tenant_id: tenantId,
    cliente_id: clienteId,
    category: "cliente",
    titulo: titulo || "Sin título",
    contenido,
    embedding: `[${emb.embedding.join(",")}]`,
    activo: true,
  });
  return true;
}

export async function agregarConocimientoPublico(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const cli = await clientePorToken(token);
  if (!cli) return;
  const titulo = String(formData.get("titulo") ?? "").trim();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!contenido) return;
  await insertarChunk(cli.tenant_id as string, cli.id, titulo, contenido);
  await refrescarPersona(cli.id);
  revalidatePath(`/onboarding/${token}`);
}

/** Sube un documento de texto (.txt/.md), lo trocea, embebe cada trozo y lo carga al RAG del cliente. */
export async function subirDocumento(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const token = String(formData.get("token") ?? "");
  const cli = await clientePorToken(token);
  if (!cli) return { error: "Link inválido o vencido." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Elegí un archivo." };

  const esImagen = file.type.startsWith("image/");
  const limite = esImagen ? 8 * 1024 * 1024 : 512 * 1024;
  if (file.size > limite) return { error: esImagen ? "La imagen es muy grande (máx 8 MB)." : "El archivo es muy grande (máx 512 KB)." };

  let text: string;
  if (esImagen) {
    // Foto de precios/menú/flyer → OCR con el modelo de visión del VPS.
    const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    try {
      text = await extraerTextoImagen(b64, file.type);
    } catch {
      return { error: "No pude leer la imagen. Probá con una foto más nítida." };
    }
    if (!text.trim()) return { error: "No encontré texto en la imagen." };
  } else {
    text = await file.text();
  }
  // Troceo simple por párrafos, agrupando hasta ~700 chars por chunk (máx 40 chunks).
  const parrafos = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of parrafos) {
    if ((buf + " " + p).length > 700 && buf) { chunks.push(buf); buf = p; }
    else buf = buf ? `${buf} ${p}` : p;
  }
  if (buf) chunks.push(buf);
  const limitados = chunks.slice(0, 40);
  if (!limitados.length) return { error: "El archivo no tenía texto." };

  const base = file.name.replace(/\.[^.]+$/, "").slice(0, 60);
  let ok = 0;
  for (const [i, texto] of limitados.entries()) {
    if (await insertarChunk(cli.tenant_id as string, cli.id, `${base} (${i + 1})`, texto)) ok++;
  }
  await refrescarPersona(cli.id);
  revalidatePath(`/onboarding/${token}`);
  return ok ? { ok: true } : { error: "No se pudo procesar el documento." };
}
