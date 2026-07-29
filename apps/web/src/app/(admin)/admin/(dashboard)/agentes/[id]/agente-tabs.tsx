"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@autoking/ui";

/** Todo lo de un agente vive adentro del agente, no suelto en el sidebar. */
const TABS = [
  { slug: "", label: "Configuración" },
  { slug: "conversaciones", label: "Conversaciones" },
  { slug: "leads", label: "Leads" },
  { slug: "prospeccion", label: "Prospección" },
];

export function AgenteTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/admin/agentes/${id}`;

  return (
    <nav className="mt-5 flex flex-wrap gap-1 border-b border-[var(--line)]">
      {TABS.map((t) => {
        const href = t.slug ? `${base}/${t.slug}` : base;
        const active = t.slug ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={t.slug || "config"}
            href={href}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-blue-bright text-white"
                : "border-transparent text-[var(--color-muted)] hover:text-white",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
