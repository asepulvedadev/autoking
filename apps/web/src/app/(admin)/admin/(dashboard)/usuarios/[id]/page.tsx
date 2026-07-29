import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/session";
import { isPrivileged, type Role } from "@/lib/roles";
import { UserForm, type UserRow } from "../user-form";
import { updateUser } from "../actions";
import { DeleteUserButton } from "./delete-button";

export default async function EditUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");
  if (!isPrivileged(me.role)) redirect("/admin");

  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("profiles").select("full_name, phone, role").eq("id", id).single(),
  ]);
  if (!authUser?.user) notFound();

  const user: UserRow = {
    id,
    email: authUser.user.email ?? "",
    full_name: (profile?.full_name as string | null) ?? null,
    phone: (profile?.phone as string | null) ?? null,
    role: ((profile?.role as string) ?? "vendedor") as Role,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/usuarios" className="text-sm text-[var(--color-muted)] hover:text-white">← Usuarios</Link>
      <h1 className="mt-2 font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">
        {user.full_name || user.email}
      </h1>

      <UserForm user={user} action={updateUser} />

      {id !== me.id && (
        <div className="mt-10 border-t border-[var(--line)] pt-6">
          <p className="mb-3 text-sm text-[var(--color-faint)]">Zona peligrosa</p>
          <DeleteUserButton id={id} name={user.full_name || user.email} />
        </div>
      )}
    </div>
  );
}
