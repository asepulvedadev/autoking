"use server";

import { createClient } from "@/lib/supabase/server";

export type LeadState = { ok?: boolean; error?: "required" | "fail" };

export async function submitLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const name = str("name");
  const whatsapp = str("whatsapp");
  if (!name || !whatsapp) return { error: "required" };

  const supabase = await createClient();
  // RLS: anon puede insertar leads (no leer). No hace falta sesión.
  const { error } = await supabase.from("leads").insert({
    name,
    business: str("business") || null,
    whatsapp,
    email: str("email") || null,
    message: str("message") || null,
    source: "landing",
  });

  if (error) return { error: "fail" };
  return { ok: true };
}
