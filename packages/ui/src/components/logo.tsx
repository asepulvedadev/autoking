import { cn } from "../lib/cn";

/** Ruta pública del wordmark. Cada app que use <Logo> debe tener este
 *  archivo en su carpeta `public/` (se sirve como `/AutoKing-logo.png`). */
const LOGO_SRC = "/AutoKing-logo.png";
const LOGO_RATIO = 712 / 176; // dimensiones reales del PNG

/**
 * Logotipo AutoKing (wordmark completo: corona-K + "AutoKing").
 * Controlá el tamaño con `height` (px); el ancho se calcula por aspect ratio.
 * Usa <img> a propósito para mantener el design system agnóstico de Next.
 */
export function Logo({ className, height = 34 }: { className?: string; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="AutoKing"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      draggable={false}
      className={cn("block w-auto select-none", className)}
      style={{ height }}
    />
  );
}
