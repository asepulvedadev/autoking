import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface MarqueeProps {
  children: ReactNode;
  speed?: number; // seconds per loop
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}

/** Cinta horizontal en loop infinito (para franjas de logos).
 *  Duplica el contenido para un bucle sin costuras. */
export function Marquee({
  children,
  speed = 32,
  reverse = false,
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  const trackStyle = {
    animationDuration: `${speed}s`,
    animationDirection: reverse ? ("reverse" as const) : undefined,
  };

  return (
    <div className={cn("group flex w-full overflow-hidden", className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          style={trackStyle}
          className={cn(
            "flex shrink-0 items-center justify-around gap-12 pr-12 animate-marquee",
            pauseOnHover && "group-hover:[animation-play-state:paused]",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
