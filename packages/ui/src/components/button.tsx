import { forwardRef } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-semibold whitespace-nowrap cursor-pointer border border-transparent transition-[transform,box-shadow,background,border-color] duration-200 ease-[var(--ease)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-bright focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-blue-bright via-blue to-blue-deep text-white shadow-[var(--shadow-blue)] hover:-translate-y-[3px] hover:shadow-[var(--shadow-blue-strong)]",
  secondary:
    "bg-white/[0.03] text-ink border-[var(--line-strong)] backdrop-blur-sm hover:-translate-y-[3px] hover:border-blue-bright hover:bg-blue/[0.08]",
};

const sizes: Record<Size, string> = {
  md: "px-7 py-[15px] text-[15.5px]",
  lg: "px-10 py-[19px] text-[17px]",
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
