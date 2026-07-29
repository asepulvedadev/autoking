"use client";

import { useActionState } from "react";
import Link from "next/link";
import { buttonVariants } from "@autoking/ui";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/roles";
import type { UserState } from "./actions";

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
};

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright disabled:opacity-60";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";

export function UserForm({
  user,
  action,
}: {
  user?: UserRow;
  action: (prev: UserState, formData: FormData) => Promise<UserState>;
}) {
  const [state, formAction, pending] = useActionState<UserState, FormData>(action, {});
  const editing = Boolean(user);

  return (
    <form action={formAction} className="mt-6 flex max-w-2xl flex-col gap-5">
      {user && <input type="hidden" name="id" value={user.id} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="full_name">Nombre</label>
          <input id="full_name" name="full_name" defaultValue={user?.full_name ?? ""} placeholder="Juan Pérez" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="phone">Teléfono</label>
          <input id="phone" name="phone" defaultValue={user?.phone ?? ""} placeholder="+57 300 000 0000" className={field} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="email">Email *</label>
        <input
          id="email"
          name="email"
          type="email"
          required={!editing}
          readOnly={editing}
          defaultValue={user?.email ?? ""}
          placeholder="usuario@autoking.pro"
          className={field}
        />
        {editing && <p className="mt-1 text-xs text-[var(--color-faint)]">El email no se puede cambiar desde acá.</p>}
      </div>

      <div>
        <label className={label} htmlFor="role">Rol *</label>
        <select id="role" name="role" required defaultValue={user?.role ?? "vendedor"} className={field}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <p className="mt-1.5 space-y-0.5 text-xs text-[var(--color-faint)]">
          {ROLES.map((r) => (
            <span key={r} className="block">
              <b className="text-[var(--color-muted)]">{ROLE_LABELS[r]}:</b> {ROLE_DESCRIPTIONS[r]}
            </span>
          ))}
        </p>
      </div>

      <div>
        <label className={label} htmlFor="password">
          {editing ? "Nueva contraseña (opcional)" : "Contraseña *"}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required={!editing}
          minLength={8}
          placeholder={editing ? "Dejar en blanco para no cambiarla" : "Mínimo 8 caracteres"}
          className={field}
        />
      </div>

      {state.error && <p className="text-sm text-[var(--color-danger)]">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonVariants({ variant: "primary", className: "disabled:opacity-60" })}>
          {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear usuario"}
        </button>
        <Link href="/admin/usuarios" className={buttonVariants({ variant: "secondary" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
