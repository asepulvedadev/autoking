"use client";

import { useState } from "react";

/** Muestra el link público de onboarding del cliente con botón de copiar. */
export function OnboardingLink({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/onboarding/${token}` : `/onboarding/${token}`;

  const copiar = async () => {
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">📝</span>
        <h2 className="font-semibold text-white">Link de onboarding del cliente</h2>
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Mandale este link al cliente para que cargue solo la info de su negocio y documentos. Alimenta a su agente.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-2">
        <input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 text-xs text-[var(--color-muted)] outline-none" />
        <button
          type="button"
          onClick={copiar}
          className="flex-none rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.12]"
        >
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
