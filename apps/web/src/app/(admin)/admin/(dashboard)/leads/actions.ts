"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LeadAdminState = { ok?: boolean; error?: string };

export async function updateLeadStatus(_prev: LeadAdminState, formData: FormData): Promise<LeadAdminState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  return { ok: true };
}

export async function deleteLead(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("leads").delete().eq("id", id);
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}
