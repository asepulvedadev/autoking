import "server-only";

/**
 * Cliente Kapso (server-only) para leer conversaciones y mensajes de WhatsApp
 * que atiende King. Dos bases: app.kapso.ai (conversaciones) y
 * api.kapso.ai/platform (mensajes). Auth: header X-API-Key.
 */

const KEY = process.env.KAPSO_API_KEY ?? "";
const APP_BASE = "https://app.kapso.ai/api/v1";
const PLATFORM_BASE = "https://api.kapso.ai/platform/v1";

async function kapso(base: string, path: string) {
  if (!KEY) throw new Error("KAPSO_API_KEY ausente");
  const res = await fetch(`${base}/${path}`, {
    headers: { "X-API-Key": KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Kapso ${res.status}`);
  return res.json();
}

/** POST autenticado a la Platform API de Kapso. */
async function kapsoPost<T = unknown>(path: string, body: unknown): Promise<T> {
  if (!KEY) throw new Error("KAPSO_API_KEY ausente");
  const res = await fetch(`${PLATFORM_BASE}/${path}`, {
    method: "POST",
    headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Kapso ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json() as Promise<T>;
}

// ============================================================
// Onboarding self-service (embedded signup de Meta vía Kapso Platform).
// Flujo: crear customer -> generar setup-link -> el cliente conecta su
// WhatsApp -> quedamos con su phone_number_id para enviar y bindear su agente.
// ============================================================

export type KapsoCustomer = {
  id: string;
  name: string;
  external_customer_id: string | null;
  phone_number_id: string | null;
  status: string | null;
};

export type KapsoSetupLink = { id: string; url: string; expires_at: string | null };

/** Número de WhatsApp ya conectado por un cliente vía embedded signup. */
export type KapsoNumeroConectado = {
  phone_number_id: string;
  business_account_id: string | null;
  display_phone_number: string | null;
  es_coexistence: boolean;
  status: string | null;
};

/** Crea un customer en Kapso para un cliente de AutoKing. */
export async function createKapsoCustomer(name: string, externalId: string): Promise<KapsoCustomer> {
  const j = await kapsoPost<{ data: Record<string, unknown> }>("customers", {
    customer: { name, external_customer_id: externalId },
  });
  return normalizeCustomer(j.data);
}

/**
 * Genera un setup-link (embedded signup) para que el cliente conecte su WhatsApp.
 *
 * Config elegida a propósito, verificada contra la API:
 * - `coexistence`: el cliente conecta el número que YA usa y sigue con su app de
 *   WhatsApp Business. Es literalmente el argumento de venta ("no cambiás de número").
 *   El pool de números instantáneos de Kapso es **solo EEUU** — la API responde
 *   "Custom Twilio credentials are required to set non-US phone_number_country_isos" —
 *   así que provisionar no es opción para Colombia sin traer Twilio propio.
 * - `partner_managed`: AutoKing le paga a Meta las conversaciones y le cobra al
 *   cliente la mensualidad fija del plan. Coherente con los límites por plan.
 * - `language: es`: si no, el cliente ve la pantalla de conexión en inglés.
 */
export async function createKapsoSetupLink(
  customerId: string,
  opts: { permitirDedicado?: boolean } = {},
): Promise<KapsoSetupLink> {
  const j = await kapsoPost<{ data: { id: string; url: string; expires_at?: string } }>(
    `customers/${encodeURIComponent(customerId)}/setup_links`,
    {
      setup_link: {
        meta_billing_mode: "partner_managed",
        allowed_connection_types: opts.permitirDedicado ? ["coexistence", "dedicated"] : ["coexistence"],
        provision_phone_number: false,
        language: "es",
        success_redirect_url: "https://www.autoking.pro/onboarding/listo",
        failure_redirect_url: "https://www.autoking.pro/onboarding/error",
      },
    },
  );
  return { id: j.data.id, url: j.data.url, expires_at: j.data.expires_at ?? null };
}

/**
 * Busca el número que el cliente conectó.
 *
 * OJO: el customer NO trae el phone_number_id — la relación vive del otro lado,
 * en `whatsapp/phone_numbers.customer_id`. Consultar el customer (como se hacía
 * antes) devolvía siempre null, así que el panel nunca se enteraba de que el
 * cliente ya había conectado su WhatsApp.
 */
export async function getKapsoConnectedNumber(customerId: string): Promise<KapsoNumeroConectado | null> {
  try {
    const j = await kapso(PLATFORM_BASE, `whatsapp/phone_numbers?customer_id=${encodeURIComponent(customerId)}`);
    const rows = (j.data ?? []) as Record<string, unknown>[];
    // Preferimos uno CONNECTED; si no hay, devolvemos el primero para poder mostrar el estado.
    const n = rows.find((r) => String(r.status ?? "").toUpperCase() === "CONNECTED") ?? rows[0];
    if (!n?.phone_number_id) return null;
    return {
      phone_number_id: String(n.phone_number_id),
      business_account_id: (n.business_account_id as string) ?? null,
      display_phone_number: (n.display_phone_number as string) ?? null,
      es_coexistence: Boolean(n.is_coexistence),
      status: (n.status as string) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Crea el template de recordatorio de cita en la WABA del cliente.
 *
 * LOS TEMPLATES SON POR WABA. El `recordatorio_cita` aprobado en la cuenta de
 * AutoKing NO sirve para el número del cliente: cada WABA necesita el suyo,
 * aprobado por Meta. Si esto no corre al provisionar, el primer recordatorio
 * del cliente falla y no se entiende por qué.
 *
 * Y sin template no hay alternativa: fuera de la ventana de 24h WhatsApp solo
 * deja mandar plantillas aprobadas, y un recordatorio para mañana siempre cae
 * fuera de esa ventana.
 */
export async function crearTemplateRecordatorio(
  businessAccountId: string,
): Promise<{ id: string | null; status: string | null; yaExistia: boolean }> {
  const body = {
    name: "recordatorio_cita",
    category: "UTILITY",
    language: "es_CO",
    parameter_format: "NAMED",
    components: [
      {
        type: "BODY",
        text: "Hola {{nombre}} 👋 Te recordamos tu cita de {{servicio}} el {{fecha}} a las {{hora}}. ¿Nos confirmás que venís?",
        example: {
          body_text_named_params: [
            { param_name: "nombre", example: "Laura" },
            { param_name: "servicio", example: "corte de pelo" },
            { param_name: "fecha", example: "sábado 1 de agosto" },
            { param_name: "hora", example: "10:00 a. m." },
          ],
        },
      },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Confirmar" },
          { type: "QUICK_REPLY", text: "Reagendar" },
          { type: "QUICK_REPLY", text: "Cancelar" },
        ],
      },
    ],
  };

  if (!KEY) throw new Error("KAPSO_API_KEY ausente");
  const res = await fetch(
    `https://api.kapso.ai/meta/whatsapp/v24.0/${encodeURIComponent(businessAccountId)}/message_templates`,
    {
      method: "POST",
      headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
  const txt = await res.text();
  // Reprovisionar un cliente no debe romper: si el template ya existe, seguimos.
  if (!res.ok) {
    if (/already exists|duplicate/i.test(txt)) return { id: null, status: "existente", yaExistia: true };
    throw new Error(`Kapso template ${res.status}: ${txt.slice(0, 200)}`);
  }
  const j = JSON.parse(txt || "{}");
  return { id: j.id ?? null, status: j.status ?? null, yaExistia: false };
}

/** Lee el estado del customer para saber si ya conectó su número. */
export async function getKapsoCustomer(customerId: string): Promise<KapsoCustomer | null> {
  try {
    const j = await kapso(PLATFORM_BASE, `customers/${encodeURIComponent(customerId)}`);
    return normalizeCustomer((j.data ?? j) as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Normaliza el customer y busca el phone_number_id venga donde venga. */
function normalizeCustomer(d: Record<string, unknown>): KapsoCustomer {
  const phone =
    (d.phone_number_id as string) ??
    ((d.whatsapp_config as Record<string, unknown>)?.phone_number_id as string) ??
    ((Array.isArray(d.phone_numbers) ? (d.phone_numbers[0] as Record<string, unknown>)?.phone_number_id : null) as string) ??
    null;
  return {
    id: String(d.id ?? ""),
    name: String(d.name ?? ""),
    external_customer_id: (d.external_customer_id as string) ?? null,
    phone_number_id: phone,
    status: (d.status as string) ?? null,
  };
}

export type KapsoConversation = {
  id: string;
  phone_number: string;
  contact_name: string | null;
  last_active_at: string | null;
  status: string | null;
  /** internal_id del número que la atendió: por acá se separa King de Mayand. */
  whatsapp_config_id: string | null;
};

export type KapsoMessage = {
  id: string;
  type: string;
  timestamp: string | null;
  text: string;
  direction: "inbound" | "outbound";
  status?: string;
  hasMedia?: boolean;
};

/** Parsea un timestamp de WhatsApp (Unix segundos) o ISO a milisegundos. */
function tsMs(ts: string | null): number {
  if (!ts) return 0;
  if (/^\d{9,}$/.test(ts)) return Number(ts) * 1000;
  const t = new Date(ts).getTime();
  return isNaN(t) ? 0 : t;
}

/** Extrae el texto de un mensaje sin importar el formato (Meta vs Kapso). */
function messageText(m: Record<string, unknown>): string {
  const t = m.text as unknown;
  if (typeof t === "string") return t;
  if (t && typeof t === "object" && "body" in t) return String((t as { body?: string }).body ?? "");
  // fallback para media/interactivos
  const type = String(m.type ?? "");
  if (type && type !== "text") return `[${type}]`;
  return "";
}

/**
 * Conversaciones de WhatsApp. Con `configId` devuelve SOLO las del número de ese
 * agente — es lo que separa lo de King de lo de Mayand.
 *
 * El filtro se hace acá y no en la query: Kapso **ignora** `phone_number_id` y
 * `whatsapp_config_id` como parámetros (probado: devuelve todo igual). Lo que sí
 * trae cada conversación es el campo `whatsapp_config_id`, así que se filtra
 * del lado nuestro. Por eso se pide un `per_page` más grande cuando hay filtro:
 * si no, las de un agente con poco tráfico quedarían fuera de la primera página.
 */
export async function listConversations(limit = 60, configId?: string | null): Promise<KapsoConversation[]> {
  const traer = configId ? Math.max(limit, 200) : limit;
  const j = await kapso(APP_BASE, `whatsapp_conversations?per_page=${traer}`);
  const arr = Array.isArray(j) ? j : (j.data ?? []);
  return (arr as KapsoConversation[])
    .filter((c) => c && c.phone_number)
    .filter((c) => !configId || c.whatsapp_config_id === configId)
    .sort((a, b) => new Date(b.last_active_at ?? 0).getTime() - new Date(a.last_active_at ?? 0).getTime())
    .slice(0, limit);
}

export async function getConversation(id: string): Promise<KapsoConversation | null> {
  try {
    const j = await kapso(APP_BASE, `whatsapp_conversations/${id}`);
    return (j.data ?? j) as KapsoConversation;
  } catch {
    return null;
  }
}

export async function getMessages(conversationId: string, limit = 100): Promise<KapsoMessage[]> {
  const capped = Math.min(Math.max(1, limit), 100); // el endpoint de Kapso limita a 100
  const j = await kapso(PLATFORM_BASE, `whatsapp/messages?conversation_id=${conversationId}&limit=${capped}`);
  const arr = (Array.isArray(j) ? j : (j.data ?? [])) as Record<string, unknown>[];
  return arr
    .map((m) => {
      const kapso = (m.kapso ?? {}) as { direction?: string; status?: string; has_media?: boolean };
      return {
        id: String(m.id ?? ""),
        type: String(m.type ?? "text"),
        timestamp: (m.timestamp as string) ?? null,
        text: messageText(m),
        direction: (kapso.direction === "inbound" ? "inbound" : "outbound") as "inbound" | "outbound",
        status: kapso.status,
        hasMedia: kapso.has_media,
      };
    })
    .sort((a, b) => tsMs(a.timestamp) - tsMs(b.timestamp));
}
