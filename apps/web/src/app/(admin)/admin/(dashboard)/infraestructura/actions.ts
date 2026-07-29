"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { toggleAgente } from "@/lib/control";

export async function toggleAgenteAction(formData: FormData) {
  const me = await getSessionProfile();
  if (!me || !isPrivileged(me.role)) return;

  const id = String(formData.get("id") ?? "");
  const activo = String(formData.get("activo") ?? "") === "true";
  await toggleAgente(id, activo);
  revalidatePath("/admin/infraestructura");
}
