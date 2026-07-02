"use client";

import { useActionState } from "react";
import Link from "next/link";
import { buttonVariants } from "@autoking/ui";
import type { TestimonioState } from "./actions";

export type Testimonio = {
  id: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  rating: number;
  avatar_url: string | null;
  published: boolean;
  sort_order: number;
};

const field =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-faint)] focus:border-blue-bright";
const label = "mb-1.5 block text-sm text-[var(--color-muted)]";

export function TestimonioForm({
  testimonio,
  action,
}: {
  testimonio?: Testimonio;
  action: (prev: TestimonioState, formData: FormData) => Promise<TestimonioState>;
}) {
  const [state, formAction, pending] = useActionState<TestimonioState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-6 flex max-w-2xl flex-col gap-5">
      {testimonio && <input type="hidden" name="id" value={testimonio.id} />}

      <div>
        <label className={label} htmlFor="quote">Testimonio *</label>
        <textarea id="quote" name="quote" rows={3} required defaultValue={testimonio?.quote ?? ""} placeholder="Lo que dijo el cliente…" className={field} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="author_name">Nombre *</label>
          <input id="author_name" name="author_name" required defaultValue={testimonio?.author_name ?? ""} placeholder="María G." className={field} />
        </div>
        <div>
          <label className={label} htmlFor="author_role">Negocio / rol</label>
          <input id="author_role" name="author_role" defaultValue={testimonio?.author_role ?? ""} placeholder="Spa · Bogotá" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="rating">Estrellas</label>
          <select id="rating" name="rating" defaultValue={String(testimonio?.rating ?? 5)} className={field}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{"★".repeat(n)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="sort_order">Orden</label>
          <input id="sort_order" name="sort_order" type="number" defaultValue={testimonio?.sort_order ?? 0} className={field} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="avatar_url">Foto (URL, opcional)</label>
        <input id="avatar_url" name="avatar_url" defaultValue={testimonio?.avatar_url ?? ""} placeholder="https://…" className={field} />
      </div>

      <label className="flex items-center gap-3 text-sm text-[var(--color-ink)]">
        <input type="checkbox" name="published" defaultChecked={testimonio ? testimonio.published : true} className="h-4 w-4 accent-[var(--color-blue-bright)]" />
        Publicado (visible en la landing)
      </label>

      {state.error && <p className="text-sm text-[var(--color-danger)]">{state.error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className={buttonVariants({ variant: "primary", className: "disabled:opacity-60" })}>
          {pending ? "Guardando…" : testimonio ? "Guardar cambios" : "Crear testimonio"}
        </button>
        <Link href="/admin/testimonios" className={buttonVariants({ variant: "secondary" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
