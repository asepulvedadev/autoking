"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, SUPPORT_EMAIL } from "@/lib/email/send";
import { newLeadInternal, leadThanks } from "@/lib/email/templates";
import { chatAgent } from "@/lib/agents-bridge";
import { getTranslations } from "next-intl/server";

export type Lead = { name: string; business: string | null; message: string | null; locale: string | null };
export type LeadState = { ok?: boolean; error?: "required" | "consent" | "fail"; lead?: Lead };

// Fase 1: captura instantánea. Guarda el lead + notifica al equipo + agradece al
// prospecto. Rápido (~0.5s) para que el usuario tenga confirmación inmediata.
export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const name = str("name");
  const whatsapp = str("whatsapp");
  const locale = str("locale").startsWith("en") ? "en" : "es";
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

  return { ok: true, lead: { name, business: lead.business, message: lead.message, locale } };
}

// Fase 2: respuesta inmediata y personalizada del agente (autoking-web, sandbox
// sin herramientas). El prospecto EXPERIMENTA al agente respondiéndole en vivo.
export async function getAgentReply(lead: Lead): Promise<{ reply: string }> {
  const t = await getTranslations({ locale: lead.locale ?? "es", namespace: "LeadForm" });
  const fallback = t("agentFallback", { name: lead.name });
  const prompt = [
    t("agentPromptIntro"),
    t("agentPromptName", { name: lead.name }),
    lead.business ? t("agentPromptBusiness", { business: lead.business }) : "",
    lead.message ? t("agentPromptMessage", { message: lead.message }) : "",
    t("agentPromptInstruction"),
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
