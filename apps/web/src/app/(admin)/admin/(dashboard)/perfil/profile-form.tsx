"use client";

import { useActionState } from "react";
import { buttonVariants } from "@autoking/ui";
import { updateProfile, type ProfileState } from "./actions";

type Profile = { full_name: string | null; phone: string | null; avatar_url: string | null };

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright disabled:opacity-60";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="mt-6 flex max-w-lg flex-col gap-5">
      <div>
        <label className={label}>Email</label>
        <input type="email" value={email} disabled className={field} />
        <p className="mt-1 text-xs text-[var(--color-faint)]">El email no se puede cambiar desde acá.</p>
      </div>
      <div>
        <label className={label} htmlFor="full_name">Nombre completo</label>
        <input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Tu nombre" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="phone">Teléfono</label>
        <input id="phone" name="phone" defaultValue={profile?.phone ?? ""} placeholder="+57 300 000 0000" className={field} />
      </div>
      <div>
        <label className={label} htmlFor="avatar_url">Foto (URL)</label>
        <input id="avatar_url" name="avatar_url" defaultValue={profile?.avatar_url ?? ""} placeholder="https://…" className={field} />
      </div>

      {state.error && <p className="text-sm text-[var(--color-danger)]">{state.error}</p>}
      {state.ok && <p className="text-sm text-[var(--color-success)]">✓ Cambios guardados.</p>}

      <button type="submit" disabled={pending} className={buttonVariants({ variant: "primary", className: "self-start disabled:opacity-60" })}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
