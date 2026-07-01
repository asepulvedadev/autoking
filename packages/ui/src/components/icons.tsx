import { cn } from "../lib/cn";

type IconProps = { className?: string };

/** Glifo oficial de WhatsApp (relleno). */
export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn("h-[19px] w-[19px]", className)}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.01c-.25.69-1.45 1.32-1.99 1.36-.53.04-1.03.23-3.49-.73-2.95-1.16-4.83-4.19-4.98-4.39-.14-.2-1.19-1.58-1.19-3.01s.75-2.13 1.02-2.42c.27-.29.59-.37.79-.37.2 0 .4.002.57.01.18.008.43-.07.67.51.25.6.84 2.07.91 2.22.07.15.12.33.02.53-.1.2-.15.32-.29.5-.15.17-.31.38-.44.51-.15.15-.3.3-.13.59.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.72.81 2.01.96.29.15.49.22.56.34.07.12.07.69-.18 1.38z" />
    </svg>
  );
}

/** Check de lista (stroke). */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("h-[19px] w-[19px]", className)}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
