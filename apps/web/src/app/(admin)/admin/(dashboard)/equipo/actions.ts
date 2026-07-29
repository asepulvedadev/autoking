"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";

export type EquipoState = { ok?: boolean; error?: string };

async function guard() {
  const me = await getSessionProfile();
  return me && isPrivileged(me.role) ? me : null;
}

function parse(fd: FormData) {
  const str = (k: string) => String(fd.get(k) ?? "").trim();
  const pais = str("territorio_pais");
  return {
    whatsapp: str("whatsapp").replace(/[^0-9]/g, ""),
    nombre: str("nombre"),
    rol: str("rol") || "vendedor",
    territorio_pais: ["colombia", "mexico", "all"].includes(pais) ? pais : null,
    territorio_ciudad: str("territorio_ciudad") || null,
    recibe_leads: str("recibe_leads") === "on" || str("recibe_leads") === "true",
    activo: str("activo") === "on" || str("activo") === "true",
  };
}

export async function crearMiembro(_prev: EquipoState, fd: FormData): Promise<EquipoState> {
  if (!(await guard())) return { error: "Solo un administrador puede gestionar el equipo." };
  const v = parse(fd);
  if (!v.whatsapp) return { error: "El WhatsApp es obligatorio." };
  if (!v.nombre) return { error: "El nombre es obligatorio." };
  // 'all' o país sin ciudad = cobertura amplia; ciudad requiere país
  if (v.territorio_ciudad && !v.territorio_pais) return { error: "Si asignás una ciudad, elegí también el país." };

  // Cliente de sesión, no service role: RLS resuelve el tenant_id (default
  // app.tenant_actual()) y verifica con WITH CHECK que sea uno propio.
  const supabase = await createClient();
  const { error } = await supabase.from("equipo").insert(v);
  if (error) return { error: error.message.includes("duplicate") ? "Ese WhatsApp ya está en el equipo." : error.message };
  revalidatePath("/admin/equipo");
  return { ok: true };
}

export async function actualizarMiembro(fd: FormData) {
  if (!(await guard())) return;
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const v = parse(fd);
  const supabase = await createClient();
  await supabase.from("equipo").update({ ...v, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/equipo");
}

export async function eliminarMiembro(fd: FormData) {
  if (!(await guard())) return;
  const id = String(fd.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("equipo").delete().eq("id", id);
  revalidatePath("/admin/equipo");
}
