"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { cn } from "../lib/cn";

/** Barra fina arriba de todo que refleja el progreso de scroll de la página. */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });

  return (
    <motion.div
      style={{ scaleX }}
      className={cn(
        "fixed inset-x-0 top-0 z-[200] h-[3px] origin-left bg-gradient-to-r from-blue-bright via-blue to-blue-deep",
        className,
      )}
    />
  );
}
