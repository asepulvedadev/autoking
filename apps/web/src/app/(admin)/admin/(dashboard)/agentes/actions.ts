"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { provisionAgent, chatAgent, type AgentConfig } from "@/lib/agents-bridge";

export type AgentFormState = { error?: string };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function createAgent(_prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const user = await currentUser();
  if (!user) return { error: "No autenticado." };

  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const business_name = str("business_name");
  if (!business_name) return { error: "El nombre del negocio es obligatorio." };

  // "servicios": una línea por servicio, formato "Nombre | precio | duración"
  const services = str("services")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, price, duration] = l.split("|").map((s) => s.trim());
      return { name: name ?? "", price: price || undefined, duration: duration || undefined };
    })
    .filter((s) => s.name.length > 0);

  const config: AgentConfig = {
    business_name,
    industry: str("industry") || undefined,
    assistant_name: str("assistant_name") || undefined,
    emoji: str("emoji") || undefined,
    tone: str("tone") || undefined,
    hours: str("hours") || undefined,
    location: str("location") || undefined,
    services,
    notes: str("notes") || undefined,
  };

  try {
    await provisionAgent(config);
  } catch (e) {
    return { error: `No se pudo crear el agente: ${(e as Error).message}` };
  }

  revalidatePath("/admin/agentes");
  redirect("/admin/agentes");
}

export async function testChat(
  agentId: string,
  message: string,
  session: string,
): Promise<{ reply?: string; error?: string }> {
  const user = await currentUser();
  if (!user) return { error: "No autenticado." };
  try {
    return { reply: await chatAgent(agentId, message, session) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
