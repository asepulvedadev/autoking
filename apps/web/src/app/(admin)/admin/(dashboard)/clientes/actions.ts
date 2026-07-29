"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { provisionAgent } from "@/lib/agents-bridge";
import {
  createKapsoCustomer,
  createKapsoSetupLink,
  getKapsoConnectedNumber,
  crearTemplateRecordatorio,
} from "@/lib/kapso";
import { provisionAgente, refreshPersona } from "@/lib/control";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Si el cliente tiene agente activado, recompone su persona (info + conocimiento) en el VPS. */
async function refrescarPersonaSiActivo(supabase: SupabaseClient, clienteId: string) {
  const { data: c } = await supabase
    .from("clientes")
    .select("business_name, industry, openclaw_agent_id, asistente, emoji, servicios, horario, ubicacion, tono, notas_negocio")
    .eq("id", clienteId)
    .single();
  if (!c?.openclaw_agent_id) return;
  const { data: chunks } = await supabase
    .from("knowledge_base")
    .select("titulo, contenido")
    .eq("cliente_id", clienteId);
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
    /* best-effort: si el VPS no responde, la edición igual se guardó en DB */
  }
}

export type ClienteState = { error?: string };

/** Crea (provisiona) el agente de IA de un cliente y lo linkea a su ficha. */
export async function createAgentForCliente(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const clienteId = String(formData.get("clienteId") ?? "");
  const { data } = await supabase.from("clientes").select("business_name, industry").eq("id", clienteId).single();
  if (!data) return;

  const { agentId } = await provisionAgent({
    business_name: data.business_name,
    industry: data.industry ?? undefined,
  });
  await supabase.from("clientes").update({ agent_id: agentId }).eq("id", clienteId);

  revalidatePath(`/admin/clientes/${clienteId}`);
  // Vuelve a la ficha del cliente (desde ahí se prueba/edita el agente demo).
  redirect(`/admin/clientes/${clienteId}`);
}

function parse(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    business_name: str("business_name"),
    contact_name: str("contact_name") || null,
    whatsapp: str("whatsapp") || null,
    email: str("email") || null,
    plan: str("plan") || null,
    status: str("status") || "prueba",
    industry: str("industry") || null,
    notes: str("notes") || null,
    asistente: str("asistente") || null,
    emoji: str("emoji") || null,
    servicios: str("servicios") || null,
    horario: str("horario") || null,
    ubicacion: str("ubicacion") || null,
    tono: str("tono") || null,
    notas_negocio: str("notas_negocio") || null,
    fe_tipo_documento: str("fe_tipo_documento") || null,
    fe_identificacion: str("fe_identificacion").replace(/[^0-9a-zA-Z]/g, "") || null,
    fe_dv: str("fe_dv").replace(/\D/g, "") || null,
    fe_tipo_organizacion: str("fe_tipo_organizacion") || null,
    fe_razon_social: str("fe_razon_social") || null,
    fe_nombres: str("fe_nombres") || null,
    fe_tributo: str("fe_tributo") || "ZZ",
    fe_municipio_codigo: str("fe_municipio_codigo").replace(/\D/g, "") || null,
    fe_direccion: str("fe_direccion") || null,
  };
}

/**
 * Valida el mínimo para facturación electrónica SOLO si el usuario empezó a cargarlo.
 * Así no bloquea crear un prospecto rápido, pero si ponés datos fiscales, exige el set completo.
 */
function validarFacturacion(v: ReturnType<typeof parse>): string | null {
  const empezado = v.fe_tipo_documento || v.fe_identificacion || v.fe_razon_social || v.fe_nombres;
  if (!empezado) return null; // sin datos fiscales → se puede guardar (se completan al facturar)
  if (!v.fe_tipo_documento) return "Facturación: elegí el tipo de documento.";
  if (!v.fe_identificacion) return "Facturación: falta el número de documento.";
  if (!v.fe_tipo_organizacion) return "Facturación: elegí si es persona natural o jurídica.";
  if (v.fe_tipo_organizacion === "2" && !v.fe_nombres) return "Facturación: para persona natural, poné nombres y apellidos.";
  if (v.fe_tipo_organizacion === "1" && !v.fe_razon_social) return "Facturación: para persona jurídica, poné la razón social.";
  return null;
}

export async function createCliente(_prev: ClienteState, formData: FormData): Promise<ClienteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const values = parse(formData);
  if (!values.business_name) return { error: "El nombre del negocio es obligatorio." };
  const feError = validarFacturacion(values);
  if (feError) return { error: feError };

  const { error } = await supabase.from("clientes").insert({ ...values, created_by: user.id });
  if (error) return { error: error.message };

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function updateCliente(_prev: ClienteState, formData: FormData): Promise<ClienteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const id = String(formData.get("id") ?? "");
  const values = parse(formData);
  if (!values.business_name) return { error: "El nombre del negocio es obligatorio." };
  const feError = validarFacturacion(values);
  if (feError) return { error: feError };

  const { error } = await supabase.from("clientes").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

/**
 * Onboarding self-service: crea (una vez) el customer en Kapso y genera un
 * setup-link fresco de embedded signup para que el cliente conecte su WhatsApp.
 * Guarda customer_id + url + expiración en la ficha.
 */
export async function generarSetupLinkAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const clienteId = String(formData.get("clienteId") ?? "");
  const { data } = await supabase
    .from("clientes")
    .select("business_name, kapso_customer_id")
    .eq("id", clienteId)
    .single();
  if (!data) return;

  try {
    let customerId = data.kapso_customer_id as string | null;
    if (!customerId) {
      const customer = await createKapsoCustomer(data.business_name, clienteId);
      customerId = customer.id;
    }
    const link = await createKapsoSetupLink(customerId);
    await supabase
      .from("clientes")
      .update({
        kapso_customer_id: customerId,
        kapso_setup_url: link.url,
        kapso_setup_expires_at: link.expires_at,
        wa_status: "pendiente",
      })
      .eq("id", clienteId);
  } catch (e) {
    // El error se refleja dejando el estado como estaba; lo log para diagnóstico.
    console.error("generarSetupLink:", (e as Error).message);
  }

  revalidatePath(`/admin/clientes/${clienteId}`);
}

/**
 * Consulta a Kapso si el cliente ya terminó el embedded signup. Si aparece su
 * phone_number_id, lo guardamos y marcamos WhatsApp como conectado.
 */
export async function verificarConexionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const clienteId = String(formData.get("clienteId") ?? "");
  const { data } = await supabase
    .from("clientes")
    .select("kapso_customer_id, business_name")
    .eq("id", clienteId)
    .single();
  if (!data?.kapso_customer_id) return;

  // El vínculo número↔cliente vive en whatsapp/phone_numbers.customer_id, NO en el
  // customer: preguntarle al customer (como se hacía antes) devolvía siempre null
  // y el panel nunca se enteraba de que el cliente ya había conectado.
  const numero = await getKapsoConnectedNumber(data.kapso_customer_id as string);
  if (!numero || String(numero.status).toUpperCase() !== "CONNECTED") {
    revalidatePath(`/admin/clientes/${clienteId}`);
    return;
  }

  await supabase
    .from("clientes")
    .update({
      kapso_phone_number_id: numero.phone_number_id,
      kapso_business_account_id: numero.business_account_id,
      kapso_display_phone: numero.display_phone_number,
      kapso_es_coexistence: numero.es_coexistence,
      wa_status: "conectado",
    })
    .eq("id", clienteId);

  // Los templates son POR WABA: el del cliente tiene que someterse en SU cuenta.
  // Meta tarda ~1 día en aprobar, así que conviene mandarlo apenas conecta y no
  // el día que el cliente quiera su primer recordatorio.
  // Best-effort: si falla, la conexión igual quedó guardada.
  if (numero.business_account_id) {
    try {
      await crearTemplateRecordatorio(numero.business_account_id);
    } catch (e) {
      console.error("crearTemplateRecordatorio:", (e as Error).message);
    }
  }

  revalidatePath(`/admin/clientes/${clienteId}`);
}

/**
 * Activa el agente REAL del cliente: crea su cuenta Kapso + agente + binding en el VPS
 * y reinicia el gateway. Solo administrador/dev (reinicia infraestructura viva).
 * Requiere que el WhatsApp del cliente ya esté conectado (phone_number_id).
 */
export async function activarAgenteAction(_prev: UserActivationState, formData: FormData): Promise<UserActivationState> {
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) return { error: "Solo un administrador puede activar agentes." };

  const supabase = await createClient();
  const clienteId = String(formData.get("clienteId") ?? "");
  const { data } = await supabase
    .from("clientes")
    .select(
      "business_name, industry, kapso_phone_number_id, wa_status, openclaw_agent_id, asistente, emoji, servicios, horario, ubicacion, tono, notas_negocio",
    )
    .eq("id", clienteId)
    .single();
  if (!data) return { error: "Cliente no encontrado." };
  if (data.openclaw_agent_id) return { error: "El agente ya está activado." };
  if (data.wa_status !== "conectado" || !data.kapso_phone_number_id)
    return { error: "El cliente todavía no conectó su WhatsApp." };

  const { data: chunks } = await supabase
    .from("knowledge_base")
    .select("titulo, contenido")
    .eq("cliente_id", clienteId);

  try {
    const res = await provisionAgente({
      conocimiento: (chunks ?? []) as { titulo: string | null; contenido: string }[],
      negocio: data.business_name,
      rubro: data.industry ?? undefined,
      phoneNumberId: data.kapso_phone_number_id as string,
      asistente: data.asistente ?? undefined,
      emoji: data.emoji ?? undefined,
      servicios: data.servicios
        ? (data.servicios as string).split("\n").map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      horario: data.horario ?? undefined,
      ubicacion: data.ubicacion ?? undefined,
      tono: data.tono ?? undefined,
      notas: data.notas_negocio ?? undefined,
      restart: true,
    });
    await supabase.from("clientes").update({ openclaw_agent_id: res.agentId }).eq("id", clienteId);
    revalidatePath(`/admin/clientes/${clienteId}`);
    return { ok: true };
  } catch (e) {
    return { error: `No se pudo activar el agente: ${(e as Error).message}` };
  }
}

export type UserActivationState = { ok?: boolean; error?: string };

/** Agrega un chunk de conocimiento al RAG de un cliente (embed gte-small + insert con cliente_id). */
export async function agregarConocimientoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const clienteId = String(formData.get("clienteId") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const contenido = String(formData.get("contenido") ?? "").trim();
  if (!clienteId || !contenido) return;

  const { data: emb, error: embErr } = await supabase.functions.invoke("embed", {
    body: { text: `${titulo}. ${contenido}` },
  });
  if (embErr || !Array.isArray(emb?.embedding)) return;

  await supabase.from("knowledge_base").insert({
    cliente_id: clienteId,
    category: "cliente",
    titulo: titulo || "Sin título",
    contenido,
    embedding: `[${emb.embedding.join(",")}]`,
    activo: true,
  });
  await refrescarPersonaSiActivo(supabase, clienteId);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function eliminarConocimientoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const clienteId = String(formData.get("clienteId") ?? "");
  if (id) await supabase.from("knowledge_base").delete().eq("id", id).eq("cliente_id", clienteId);
  await refrescarPersonaSiActivo(supabase, clienteId);
  revalidatePath(`/admin/clientes/${clienteId}`);
}

export async function deleteCliente(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("clientes").delete().eq("id", id);
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}
