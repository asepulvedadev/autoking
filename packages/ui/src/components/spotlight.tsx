"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SpotlightProps {
  children: ReactNode;
  className?: string;
  radius?: number;
  color?: string;
}

/** Envuelve contenido y proyecta un glow azul que sigue al cursor en hover.
 *  El glow se dibuja por encima (pointer-events-none, tenue) para verse
 *  tanto sobre tarjetas opacas como sobre contenido transparente. */
export function Spotlight({
  children,
  className,
  radius = 340,
  color = "rgba(30,107,255,0.16)",
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };

  return (
    <div ref={ref} onMouseMove={onMove} className={cn("group/spot relative", className)}>
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background: `radial-gradient(${radius}px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 70%)`,
        }}
      />
    </div>
  );
}
