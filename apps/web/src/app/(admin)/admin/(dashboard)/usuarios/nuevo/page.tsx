import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged } from "@/lib/roles";
import { UserForm } from "../user-form";
import { createUser } from "../actions";

export default async function NuevoUsuarioPage() {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");
  if (!isPrivileged(me.role)) redirect("/admin");

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/usuarios" className="text-sm text-[var(--color-muted)] hover:text-white">← Usuarios</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Nuevo usuario</h1>
      <UserForm action={createUser} />
    </div>
  );
}
