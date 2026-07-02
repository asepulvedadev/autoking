"use client";

import { deleteCliente } from "../actions";

export function DeleteClienteButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCliente}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-full border border-[rgb(255_90_90_/_0.4)] px-5 py-2.5 text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[rgb(255_80_80_/_0.1)]"
      >
        Eliminar cliente
      </button>
    </form>
  );
}
