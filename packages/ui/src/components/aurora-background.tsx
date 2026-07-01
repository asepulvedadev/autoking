import { cn } from "../lib/cn";

/** Fondo ambiental: orbes azules desenfocados que derivan lentamente.
 *  Absoluto — colocalo dentro de un contenedor `relative overflow-hidden`.
 *  Se apaga con prefers-reduced-motion (ver theme.css). */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -left-[10%] -top-[20%] h-[55vh] w-[55vh] rounded-full bg-blue/25 blur-[120px] animate-aurora" />
      <div className="absolute -top-[10%] right-[5%] h-[45vh] w-[45vh] rounded-full bg-blue-bright/20 blur-[130px] animate-aurora [animation-delay:-6s]" />
      <div className="absolute left-[30%] top-[5%] h-[40vh] w-[40vh] rounded-full bg-blue-deep/25 blur-[120px] animate-aurora [animation-delay:-11s]" />
    </div>
  );
}
