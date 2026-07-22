"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { proposalOutreach } from "@/lib/email/templates";
import type { Prospect } from "./status";

export type ProspectActionState = { ok?: boolean; error?: string; sent?: string };

/** Envía la propuesta de marca a un prospecto (por email), registra el envío y
 *  marca status='contactado'. Solo admins autenticados (RLS lo refuerza). */
export async function sendProposal(_prev: ProspectActionState, formData: FormData): Promise<ProspectActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const id = String(formData.get("id") ?? "");
  const { data: p } = await supabase.from("prospects").select("*").eq("id", id).single();
  const prospect = p as Prospect | null;
  if (!prospect) return { error: "Prospecto no encontrado." };
  if (!prospect.email) return { error: "Este prospecto no tiene email. Contactalo por WhatsApp." };
  if (prospect.status === "descartado") return { error: "Prospecto descartado (pidió baja). No se contacta." };

  const mail = proposalOutreach({
    businessName: prospect.business_name,
    category: prospect.category,
    city: prospect.city,
  });

  const res = await sendEmail({ to: prospect.email, subject: mail.subject, html: mail.html, text: mail.text });

  await supabase.from("prospect_outreach").insert({
    prospect_id: prospect.id,
    channel: "email",
    subject: mail.subject,
    status: res.ok ? "enviado" : "fallo",
    detail: res.ok ? null : ("error" in res ? res.error : "desconocido"),
  });

  if (!res.ok) return { error: `No se pudo enviar: ${"error" in res ? res.error : "error"}` };

  await supabase.from("prospects").update({ status: "contactado" }).eq("id", prospect.id);
  revalidatePath("/admin/prospeccion");
  return { ok: true, sent: prospect.business_name };
}

/** Cambia el estado de un prospecto manualmente (calificar, descartar, etc.). */
export async function setProspectStatus(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  await supabase.from("prospects").update({ status }).eq("id", id);
  revalidatePath("/admin/prospeccion");
}
