import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Grilla bento de 6 columnas (en desktop). Las tarjetas definen su tamaño
 *  con clases de span (`sm:col-span-2`, `lg:row-span-2`, etc.). */
export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid auto-rows-[minmax(150px,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Tarjeta de la grilla bento con el estilo de superficie de AutoKing. */
export function BentoCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border p-6 transition-[transform,border-color] duration-300",
        "border-[var(--line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg-2)]",
        "hover:-translate-y-1 hover:border-[var(--line-strong)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
