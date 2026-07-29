"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/session";
import { ROLES, isPrivileged, type Role } from "@/lib/roles";

export type UserState = { error?: string; ok?: boolean };

/** Garantiza que quien llama sea administrador o dev. Devuelve su perfil o corta. */
async function requirePrivileged() {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");
  if (!isPrivileged(me.role)) return null;
  return me;
}

function parse(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "").trim();
  const role = str("role") as Role;
  return {
    email: str("email").toLowerCase(),
    full_name: str("full_name"),
    phone: str("phone"),
    password: str("password"),
    role: ROLES.includes(role) ? role : ("vendedor" as Role),
  };
}

export async function createUser(_prev: UserState, formData: FormData): Promise<UserState> {
  const me = await requirePrivileged();
  if (!me) return { error: "No tenés permiso para gestionar usuarios." };

  const v = parse(formData);
  if (!v.email) return { error: "El email es obligatorio." };
  if (v.password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: v.email,
    password: v.password,
    email_confirm: true,
    user_metadata: { full_name: v.full_name, role: v.role },
  });
  if (error) return { error: error.message };

  // El trigger crea el profile con role/full_name de la metadata; fijamos phone y reforzamos rol.
  await admin
    .from("profiles")
    .update({ full_name: v.full_name, phone: v.phone || null, role: v.role })
    .eq("id", data.user.id);

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function updateUser(_prev: UserState, formData: FormData): Promise<UserState> {
  const me = await requirePrivileged();
  if (!me) return { error: "No tenés permiso para gestionar usuarios." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Usuario inválido." };
  const v = parse(formData);

  const admin = createAdminClient();

  // Evitar quedarse sin administradores: no permitir degradar al último administrador.
  if (v.role !== "administrador") {
    const { data: target } = await admin.from("profiles").select("role").eq("id", id).single();
    if (target?.role === "administrador") {
      const { count } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "administrador");
      if ((count ?? 0) <= 1) return { error: "No podés degradar al último administrador." };
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ full_name: v.full_name, phone: v.phone || null, role: v.role })
    .eq("id", id);
  if (error) return { error: error.message };

  // Cambio de contraseña opcional (solo si se escribió una nueva).
  if (v.password) {
    if (v.password.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
    const { error: pwErr } = await admin.auth.admin.updateUserById(id, { password: v.password });
    if (pwErr) return { error: pwErr.message };
  }

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function deleteUser(formData: FormData) {
  const me = await requirePrivileged();
  if (!me) return;

  const id = String(formData.get("id") ?? "");
  if (!id || id === me.id) return; // no te podés borrar a vos mismo

  const admin = createAdminClient();

  // No borrar al último administrador.
  const { data: target } = await admin.from("profiles").select("role").eq("id", id).single();
  if (target?.role === "administrador") {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "administrador");
    if ((count ?? 0) <= 1) return;
  }

  // Borrar el profile primero y luego el usuario de auth (robusto con o sin cascade).
  await admin.from("profiles").delete().eq("id", id);
  await admin.auth.admin.deleteUser(id);

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}
