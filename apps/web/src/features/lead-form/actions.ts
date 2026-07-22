"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, SUPPORT_EMAIL } from "@/lib/email/send";
import { newLeadInternal, leadThanks } from "@/lib/email/templates";
import { chatAgent } from "@/lib/agents-bridge";

export type Lead = { name: string; business: string | null; message: string | null };
export type LeadState = { ok?: boolean; error?: "required" | "consent" | "fail"; lead?: Lead };

// Fase 1: captura instantánea. Guarda el lead + notifica al equipo + agradece al
// prospecto. Rápido (~0.5s) para que el usuario tenga confirmación inmediata.
export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const name = str("name");
  const whatsapp = str("whatsapp");
  if (!name || !whatsapp) return { error: "required" };
  // Consentimiento obligatorio (Habeas Data, Ley 1581/2012). Se valida también
  // en el server, no solo con el `required` del checkbox.
  if (!formData.get("consent")) return { error: "consent" };

  const lead = {
    name,
    business: str("business") || null,
    whatsapp,
    email: str("email") || null,
    message: str("message") || null,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({ ...lead, source: "landing" });
  if (error) return { error: "fail" };

  // Correos (no rompen la captura si fallan).
  const team = newLeadInternal(lead);
  const jobs = [sendEmail({ to: SUPPORT_EMAIL, subject: team.subject, html: team.html, text: team.text })];
  if (lead.email) {
    const thanks = leadThanks({ name });
    jobs.push(sendEmail({ to: lead.email, subject: thanks.subject, html: thanks.html, text: thanks.text }));
  }
  await Promise.allSettled(jobs);

  return { ok: true, lead: { name, business: lead.business, message: lead.message } };
}

// Fase 2: respuesta inmediata y personalizada del agente (autoking-web, sandbox
// sin herramientas). El prospecto EXPERIMENTA al agente respondiéndole en vivo.
export async function getAgentReply(lead: Lead): Promise<{ reply: string }> {
  const fallback = `¡Gracias, ${lead.name}! 👑 Un asesor de AutoKing te contacta muy pronto por WhatsApp para montar tu agente.`;
  const prompt = [
    "Acabo de dejar mis datos en la web de AutoKing para una demo.",
    `Me llamo ${lead.name}.`,
    lead.business ? `Mi negocio es ${lead.business}.` : "",
    lead.message ? `Te cuento: ${lead.message}` : "",
    "Respóndeme cálido y personalizado (2-3 líneas): agradéceme por mi nombre, dime brevemente cómo AutoKing ayudaría a un negocio como el mío, y avísame que un asesor me contacta muy pronto por WhatsApp. No inventes precios exactos.",
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const reply = await chatAgent("autoking-web", prompt, `lead-${lead.name}`.slice(0, 40));
    return { reply: reply?.trim() || fallback };
  } catch {
    return { reply: fallback };
  }
}
