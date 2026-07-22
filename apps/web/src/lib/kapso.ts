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

export type KapsoConversation = {
  id: string;
  phone_number: string;
  contact_name: string | null;
  last_active_at: string | null;
  status: string | null;
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

export async function listConversations(limit = 60): Promise<KapsoConversation[]> {
  const j = await kapso(APP_BASE, `whatsapp_conversations?per_page=${limit}`);
  const arr = Array.isArray(j) ? j : (j.data ?? []);
  return (arr as KapsoConversation[])
    .filter((c) => c && c.phone_number)
    .sort((a, b) => new Date(b.last_active_at ?? 0).getTime() - new Date(a.last_active_at ?? 0).getTime());
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
