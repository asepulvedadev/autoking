"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ClienteState = { error?: string };

function parse(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    business_name: str("business_name"),
    contact_name: str("contact_name") || null,
    whatsapp: str("whatsapp") || null,
    email: str("email") || null,
    plan: str("plan") || null,
    status: str("status") || "prueba",
    industry: str("industry") || null,
    notes: str("notes") || null,
  };
}

export async function createCliente(_prev: ClienteState, formData: FormData): Promise<ClienteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const values = parse(formData);
  if (!values.business_name) return { error: "El nombre del negocio es obligatorio." };

  const { error } = await supabase.from("clientes").insert({ ...values, created_by: user.id });
  if (error) return { error: error.message };

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function updateCliente(_prev: ClienteState, formData: FormData): Promise<ClienteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const id = String(formData.get("id") ?? "");
  const values = parse(formData);
  if (!values.business_name) return { error: "El nombre del negocio es obligatorio." };

  const { error } = await supabase.from("clientes").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function deleteCliente(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("clientes").delete().eq("id", id);
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}
