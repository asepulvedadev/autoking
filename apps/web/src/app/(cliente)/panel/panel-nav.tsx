"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@autoking/ui";
import { createClient } from "@/lib/supabase/client";

const SECCIONES = [
  { slug: "", label: "Inicio", icono: "🏠" },
  { slug: "conversaciones", label: "Conversaciones", icono: "💬" },
  { slug: "conocimiento", label: "Conocimiento", icono: "📚" },
  { slug: "creativos", label: "Creativos", icono: "🖼️" },
  { slug: "agenda", label: "Agenda", icono: "📅" },
  { slug: "interno", label: "Interno", icono: "🔐" },
  { slug: "negocio", label: "Mi negocio", icono: "⚙️" },
];

export function PanelNav() {
  const pathname = usePathname();
  const router = useRouter();

  const salir = async () => {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {SECCIONES.map((s) => {
        const href = s.slug ? `/panel/${s.slug}` : "/panel";
        const activo = s.slug ? pathname.startsWith(href) : pathname === "/panel";
        return (
          <Link
            key={s.slug || "inicio"}
            href={href}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              activo
                ? "bg-blue/[0.14] text-white"
                : "text-[var(--color-muted)] hover:bg-white/[0.04] hover:text-white",
            )}
          >
            <span className="mr-1.5">{s.icono}</span>
            {s.label}
          </Link>
        );
      })}
      <button
        onClick={salir}
        className="ml-auto rounded-full px-3.5 py-2 text-sm font-medium text-[var(--color-faint)] transition-colors hover:text-[var(--color-danger)]"
      >
        Salir
      </button>
    </nav>
  );
}
