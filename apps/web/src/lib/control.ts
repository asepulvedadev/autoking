import "server-only";

/**
 * Cliente de la API de control de infraestructura (VPS).
 * Monitorea el VPS y los agentes, y los prende/apaga.
 */

const BASE = process.env.CONTROL_URL ?? "https://ia.autoking.pro/control";
const SECRET = process.env.CONTROL_SECRET ?? "";

async function control(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Control ${res.status}`);
  return res.json();
}

export type VpsHealth = {
  cpu: { cores: number; load1: number; load5: number; load15: number };
  ram: { total: number; usado: number; disponible: number; pct: number };
  disco: { total: number; usado: number; pct: number };
  uptimeSec: number;
  gatewayActivo: boolean;
};

export type AgenteInfra = {
  id: string;
  nombre: string;
  modelo: string;
  canal: string | null;
  activo: boolean;
  sandbox: boolean;
};

export async function getHealth(): Promise<VpsHealth> {
  return control("/health");
}

export async function getAgentesInfra(): Promise<AgenteInfra[]> {
  const j = await control("/agents");
  return (j.agents ?? []) as AgenteInfra[];
}

export async function toggleAgente(id: string, activo: boolean): Promise<void> {
  await control(`/agents/${encodeURIComponent(id)}/toggle`, { method: "POST", body: JSON.stringify({ activo }) });
}

export type ProvisionPayload = {
  slug?: string;
  negocio: string;
  rubro?: string;
  phoneNumberId: string;
  defaultTo?: string;
  asistente?: string;
  emoji?: string;
  tono?: string;
  servicios?: string[];
  horario?: string;
  ubicacion?: string;
  notas?: string;
  conocimiento?: { titulo?: string | null; contenido: string }[];
  dryRun?: boolean;
  restart?: boolean;
};

export type PersonaPayload = Omit<ProvisionPayload, "phoneNumberId" | "dryRun" | "restart"> & { phoneNumberId?: string };

export type ProvisionResult = {
  ok?: boolean;
  dryRun?: boolean;
  agentId: string;
  accountId: string;
  phoneNumberId: string;
  webhookUrl: string;
  webhookSecret: string;
  restarted?: boolean;
};

/** Provisiona (o simula con dryRun) el agente real de un cliente en el VPS. */
export async function provisionAgente(payload: ProvisionPayload): Promise<ProvisionResult> {
  return control("/agents/provision", { method: "POST", body: JSON.stringify(payload) });
}

/** Reescribe la persona (info + conocimiento) de un agente ya provisionado. Sin reinicio. */
export async function refreshPersona(agentId: string, payload: PersonaPayload): Promise<{ ok: boolean }> {
  return control(`/agents/${encodeURIComponent(agentId)}/persona`, { method: "POST", body: JSON.stringify(payload) });
}

// ============================================================
// AgentPackages: cada agente como unidad autocontenida
// ============================================================
export type PackageResumen = {
  id: string;
  nombre: string;
  tipo: string;
  version: string | null;
  tenantId: string | null;
  skills: string[];
  toolsPermitidas: number;
};

export type Herramienta = {
  tool: string;
  port: string;
  descripcion: string;
  permitida: boolean;
  confirmacion: string;
  /** `tenant` acota la operación a los datos del tenant; `global` no. */
  scope?: string;
  /**
   * ¿Su port tiene un adapter que la ejecute?
   * `false` significa que la herramienta puede estar PERMITIDA y aun así
   * responder notImplemented: el panel la muestra verde y en la conversación
   * falla. `null` = no se pudo determinar.
   */
  implementada?: boolean | null;
  motivo: string | null;
};

export type PackageDetalle = {
  id: string;
  dir: string;
  metadata: Record<string, unknown>;
  identidad: { identity: string | null; soul: string | null; instructions: string | null };
  prompts: Record<string, string>;
  skills: { nombre: string; version: string | null; instalada: boolean }[];
  herramientas: Herramienta[];
  policies: {
    runtime: Record<string, string>;
    data: Record<string, unknown>;
    integrations: Record<string, unknown>;
    confirmaciones: { action: string; confirmation?: string; reason?: string }[];
  };
  conexiones: { declaradas: string[]; manifest: unknown };
  conocimiento: { colecciones: string[]; config: unknown; ingestion: unknown };
  memoria: { declarada: Record<string, unknown>; config: unknown };
  workflows: { archivo: string; existe: boolean }[];
  runtime: { capabilities: Record<string, unknown>; runtime: Record<string, unknown> };
};

export async function listarPackages(): Promise<PackageResumen[]> {
  const j = await control("/packages");
  return (j.packages ?? []) as PackageResumen[];
}

export async function getPackage(id: string): Promise<PackageDetalle | null> {
  try {
    return (await control(`/packages/${encodeURIComponent(id)}`)) as PackageDetalle;
  } catch {
    return null;
  }
}

export async function crearPackage(input: {
  negocio: string; slug?: string; rubro?: string; asistente?: string; emoji?: string;
  servicios?: string[]; horario?: string; ubicacion?: string; tenantId?: string; dryRun?: boolean;
}): Promise<{ ok: boolean; agentId: string; log?: string }> {
  return control("/packages", { method: "POST", body: JSON.stringify(input) });
}

export async function actualizarHerramientas(
  id: string,
  tools: Record<string, { allow: boolean; confirmation: string; scope?: string } | null>,
): Promise<{ ok: boolean; aplicados: string[] }> {
  return control(`/packages/${encodeURIComponent(id)}/tools`, { method: "PATCH", body: JSON.stringify({ tools }) });
}

/**
 * Convierte un archivo a markdown para usarlo como fuente del RAG.
 *
 * El PDF se pasa con `pdftotext -layout`, que conserva columnas y tablas — sin
 * eso, una lista de precios sale ilegible. Si el PDF es escaneado no tiene texto
 * que extraer: ahí devuelve un error pidiendo subirlo como imagen, que sí pasa
 * por OCR.
 */
export async function convertirDocumento(
  nombre: string,
  base64: string,
): Promise<{ markdown: string; paginas: number; origen: string }> {
  return control("/documentos/convertir", {
    method: "POST",
    body: JSON.stringify({ nombre, base64 }),
  }) as Promise<{ markdown: string; paginas: number; origen: string }>;
}

// ============================================================
// MCP — conexiones que le dan herramientas a los agentes.
//
// ⚠️ En OpenClaw los MCP son GLOBALES: `mcp.servers` es top-level y un agente
// NO tiene campo `mcp`. "Asignarle un MCP a un agente" no existe como tal — lo
// que se hace es permitir o denegar sus herramientas por agente con
// `tools.deny`. Por eso un MCP nuevo nace denegado para todos y se habilita
// uno por uno: un agente público con un MCP de más es un agente al que un
// desconocido puede intentar hacerle ejecutar cosas por prompt injection.
// ============================================================

export type McpServer = {
  nombre: string;
  tipo: "stdio" | "http";
  command: string | null;
  url: string | null;
  enabled: boolean;
  auth: string | null;
  tieneEnv: boolean;
  agentes: string[];
};

export async function listarMcp(): Promise<{ servers: McpServer[]; agentes: string[] }> {
  return control("/mcp") as Promise<{ servers: McpServer[]; agentes: string[] }>;
}

export async function agregarMcp(input: {
  nombre: string;
  tipo: "stdio" | "http";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  auth?: "oauth";
  headers?: Record<string, string>;
  include?: string;
  exclude?: string;
}): Promise<{ ok: boolean; nombre: string; salida: string }> {
  return control("/mcp", { method: "POST", body: JSON.stringify(input) }) as Promise<{
    ok: boolean; nombre: string; salida: string;
  }>;
}

export async function quitarMcp(nombre: string): Promise<{ ok: boolean }> {
  return control(`/mcp/${encodeURIComponent(nombre)}`, { method: "DELETE" }) as Promise<{ ok: boolean }>;
}

export async function probarMcp(nombre: string): Promise<{ ok: boolean; salida: string }> {
  return control(`/mcp/${encodeURIComponent(nombre)}/probe`, { method: "POST" }) as Promise<{
    ok: boolean; salida: string;
  }>;
}

/**
 * OAuth en dos pasos — así se autoriza sin navegador en el servidor:
 *   1) sin `code` → devuelve la URL para abrir en TU navegador
 *   2) con `code` → canjea el código y guarda las credenciales
 * Es el mismo patrón que usa Claude Code cuando corre headless.
 */
export async function loginMcp(
  nombre: string,
  code?: string,
): Promise<{ ok: boolean; url: string | null; completado: boolean; salida: string }> {
  return control(`/mcp/${encodeURIComponent(nombre)}/login`, {
    method: "POST",
    body: JSON.stringify({ code }),
  }) as Promise<{ ok: boolean; url: string | null; completado: boolean; salida: string }>;
}

export async function asignarMcp(
  nombre: string,
  agentId: string,
  permitir: boolean,
): Promise<{ ok: boolean; deny: string[] }> {
  return control(`/mcp/${encodeURIComponent(nombre)}/agents`, {
    method: "POST",
    body: JSON.stringify({ agentId, permitir }),
  }) as Promise<{ ok: boolean; deny: string[] }>;
}

/**
 * Instala una skill en el AgentPackage: `skills/<slug>/SKILL.md` + manifest,
 * y la declara en `agent.yaml`.
 *
 * Acepta el .md directo o un ZIP. El ZIP se descomprime en el VPS con
 * `unzip -j`, que descarta las rutas del archivo: aunque el zip traiga entradas
 * tipo `../../etc/passwd`, todo cae plano en un temporal. El destino se arma
 * con un slug validado nuestro, nunca con un nombre de adentro del zip.
 * Probado con un zip malicioso real: no escapó nada.
 */
export async function instalarSkill(
  agentId: string,
  skill: { slug: string; nombre: string; version?: string; descripcion?: string; instrucciones?: string; zipBase64?: string },
): Promise<{ ok: boolean; slug: string; skills: string[]; chars: number }> {
  return control(`/packages/${encodeURIComponent(agentId)}/skills`, {
    method: "POST",
    body: JSON.stringify(skill),
  }) as Promise<{ ok: boolean; slug: string; skills: string[]; chars: number }>;
}

export async function borrarSkill(agentId: string, slug: string): Promise<{ ok: boolean; skills: string[] }> {
  return control(`/packages/${encodeURIComponent(agentId)}/skills/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  }) as Promise<{ ok: boolean; skills: string[] }>;
}

export async function actualizarPersona(
  id: string,
  persona: { identity?: string; soul?: string; instructions?: string },
): Promise<{ ok: boolean; written: string[] }> {
  return control(`/packages/${encodeURIComponent(id)}/persona`, { method: "PATCH", body: JSON.stringify(persona) });
}

/** Lee una imagen (foto de precios/menú/flyer) con el modelo de visión del VPS y devuelve el texto. */
export async function extraerTextoImagen(imageBase64: string, mime: string): Promise<string> {
  const res = await fetch(`${BASE}/vision/extract`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mime }),
    cache: "no-store",
    signal: AbortSignal.timeout(55_000),
  });
  if (!res.ok) throw new Error(`Vision ${res.status}`);
  const j = (await res.json()) as { text?: string };
  return j.text ?? "";
}

// helpers de formato
export function bytesToGb(b: number): string {
  return (b / 1024 ** 3).toFixed(1);
}
export function uptimeStr(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}
