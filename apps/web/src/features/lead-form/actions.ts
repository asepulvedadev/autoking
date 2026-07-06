"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, SUPPORT_EMAIL } from "@/lib/email/send";
import { newLeadInternal, leadThanks } from "@/lib/email/templates";

export type LeadState = { ok?: boolean; error?: "required" | "fail" };

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const name = str("name");
  const whatsapp = str("whatsapp");
  if (!name || !whatsapp) return { error: "required" };

  const lead = {
    name,
    business: str("business") || null,
    whatsapp,
    email: str("email") || null,
    message: str("message") || null,
  };

  const supabase = await createClient();
  // RLS: anon puede insertar leads (no leer). No hace falta sesión.
  const { error } = await supabase.from("leads").insert({ ...lead, source: "landing" });
  if (error) return { error: "fail" };

  // Notificaciones por correo (no rompen la captura del lead si fallan).
  const team = newLeadInternal(lead);
  const jobs = [sendEmail({ to: SUPPORT_EMAIL, subject: team.subject, html: team.html, text: team.text })];
  if (lead.email) {
    const thanks = leadThanks({ name });
    jobs.push(sendEmail({ to: lead.email, subject: thanks.subject, html: thanks.html, text: thanks.text }));
  }
  await Promise.allSettled(jobs);

  return { ok: true };
}
