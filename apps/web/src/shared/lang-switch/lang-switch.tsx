"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@autoking/ui";

/** Toggle ES | EN. Preserva la ruta actual al cambiar de idioma. */
export function LangSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LangSwitch");

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-full border border-[var(--line)] p-0.5", className)}
      role="group"
      aria-label={t("aria")}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => router.replace(pathname, { locale: l })}
          aria-current={l === locale}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors",
            l === locale ? "bg-blue/[0.15] text-white" : "text-[var(--color-faint)] hover:text-white",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
