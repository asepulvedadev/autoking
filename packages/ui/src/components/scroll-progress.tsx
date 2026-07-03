"use client";

import { useEffect, useRef } from "react";
import { cn } from "../lib/cn";

/** Barra fina arriba de todo que refleja el progreso de scroll de la página.
 *  Sin framer-motion: listener de scroll con rAF throttle → scaleX. */
export function ScrollProgress({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const p = max > 0 ? Math.min(Math.max(doc.scrollTop / max, 0), 1) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transform: "scaleX(0)", willChange: "transform" }}
      className={cn(
        "fixed inset-x-0 top-0 z-[200] h-[3px] origin-left bg-gradient-to-r from-blue-bright via-blue to-blue-deep",
        className,
      )}
    />
  );
}
