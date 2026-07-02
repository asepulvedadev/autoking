"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@autoking/ui";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: (
      <>
        <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
        <path d="M22 7l-10 6L2 7" />
      </>
    ),
  },
  {
    href: "/admin/testimonios",
    label: "Testimonios",
    icon: <path d="M11.3 3.5l2.4 5 5.5.8-4 3.9.9 5.4-4.9-2.6-4.9 2.6.9-5.4-4-3.9 5.5-.8z" />,
  },
  {
    href: "/admin/perfil",
    label: "Mi perfil",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
      </>
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-blue/[0.12] text-white"
                : "text-[var(--color-muted)] hover:bg-white/[0.03] hover:text-white",
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px]">
              {link.icon}
            </svg>
            {link.label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-colors hover:bg-[rgb(255_80_80_/_0.08)] hover:text-[var(--color-danger)]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-[18px] w-[18px]">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Salir
      </button>
    </nav>
  );
}
