import { forwardRef } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

/**
 * Botón.
 *
 * El primario usaba un degradado de tres paradas y se repetía en cada CTA de
 * la página — era la mayor fuente de gradientes del sitio. Ahora es un azul
 * PLANO: un botón sólido se lee como un botón, un botón con degradado se lee
 * como una decoración. El color de marca alcanza para que destaque.
 *
 * El radio pasa de píldora a `--radius-sm`. Las píldoras estaban en todos
 * lados (badges, chips, botones, avatares) y esa uniformidad de forma es lo
 * que aplana la jerarquía: cuando todo tiene la misma silueta, nada manda.
 */
const base =
  "inline-flex items-center justify-center gap-2.5 rounded-[var(--radius-sm)] font-semibold whitespace-nowrap cursor-pointer border border-transparent transition-[background-color,border-color,opacity] duration-150 ease-[var(--ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-bright focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const variants: Record<Variant, string> = {
  // La sombra azul queda SOLO acá: es la única acción que debe brillar.
  primary: "bg-blue text-white shadow-cta hover:bg-blue-bright",
  secondary: "bg-transparent text-ink border-line-strong hover:border-blue-bright hover:bg-blue/[0.06]",
};

const sizes: Record<Size, string> = {
  md: "px-6 py-3 text-[15px]",
  lg: "px-8 py-4 text-base",
};

export function buttonVariants(opts?: { variant?: Variant; size?: Size; className?: string }): string {
  const { variant = "primary", size = "md", className } = opts ?? {};
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, ...props },
  ref,
) {
  return <button ref={ref} className={buttonVariants({ variant, size, className })} {...props} />;
});
