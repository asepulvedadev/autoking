"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "@autoking/ui";
import { AdminNav } from "./admin-nav";

/** Menú móvil del admin: barra superior con hamburguesa + drawer lateral.
 *  Reusa el mismo <AdminNav /> que el sidebar de escritorio. Solo visible < md;
 *  en md+ el sidebar fijo toma el control y esto queda oculto. */
export function AdminMobileNav({ userName, userEmail, role }: { userName: string; userEmail: string; role?: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cerrar el drawer al navegar a otra sección.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquear el scroll del fondo mientras el drawer está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Barra superior — solo móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-3 md:hidden">
        <Logo height={24} />
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--line)] text-white transition-colors hover:bg-white/[0.04]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Overlay + drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_.2s_var(--ease)]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-[var(--line)] bg-[var(--color-bg-2)] p-5 shadow-2xl animate-[slideInLeft_.25s_var(--ease)]">
            <div className="mb-8 flex items-center justify-between px-2">
              <Logo height={26} />
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <AdminNav role={role} />
            <div className="mt-auto rounded-xl border border-[var(--line)] bg-[var(--color-surface)] p-3">
              <div className="truncate text-sm font-medium text-white">{userName}</div>
              <div className="truncate text-xs text-[var(--color-faint)]">{userEmail}</div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
