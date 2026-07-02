"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const avatar_url = String(formData.get("avatar_url") ?? "").trim();

  // RLS garantiza que solo puede actualizar SU propia fila.
  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone, avatar_url })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/perfil");
  return { ok: true };
}
