import "server-only";

/**
 * Cliente server-only del bridge de agentes (VPS). El secreto nunca sale del server.
 * Gestiona el plano tenant: listar, provisionar y probar agentes (inferencia pura).
 */
export type TenantAgent = {
  agentId: string;
  business: string;
  assistant: string;
  type: "system" | "client";
  updated: string | null;
};

export type AgentConfig = {
  business_name: string;
  slug?: string;
  industry?: string;
  assistant_name?: string;
  emoji?: string;
  tone?: string;
  timezone?: string;
  hours?: string;
  location?: string;
  services?: { name: string; price?: string; duration?: string }[];
  notes?: string;
};

function endpoint() {
  const url = process.env.AGENT_BRIDGE_URL;
  const secret = process.env.AGENT_BRIDGE_SECRET;
  if (!url || !secret) throw new Error("El backend de agentes no está configurado (AGENT_BRIDGE_URL / SECRET).");
  return { url: url.replace(/\/$/, ""), secret };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, secret } = endpoint();
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(75_000),
  });
  if (!res.ok) throw new Error(`Bridge respondió ${res.status}`);
  return (await res.json()) as T;
}

export async function listAgents(): Promise<TenantAgent[]> {
  const { agents } = await call<{ agents: TenantAgent[] }>("/agents");
  return agents ?? [];
}

export async function provisionAgent(config: AgentConfig): Promise<{ agentId: string; business: string }> {
  return call("/provision", { method: "POST", body: JSON.stringify(config) });
}

export async function getAgentConfig(agentId: string): Promise<(AgentConfig & { agentId?: string }) | null> {
  try {
    const { config } = await call<{ config: AgentConfig & { agentId?: string } }>(`/agents/${encodeURIComponent(agentId)}`);
    return config ?? null;
  } catch {
    return null;
  }
}

export async function deleteAgent(agentId: string): Promise<void> {
  await call(`/agents/${encodeURIComponent(agentId)}`, { method: "DELETE" });
}

export async function chatAgent(agent: string, message: string, session: string): Promise<string> {
  const { reply } = await call<{ reply: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ agent, message, session }),
  });
  return reply;
}
