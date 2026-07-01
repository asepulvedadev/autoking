"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "motion/react";

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  className?: string;
}

/** Número que transiciona suavemente cada vez que `value` cambia.
 *  Ideal para resultados reactivos (calculadoras, dashboards). */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  locale = "es-MX",
  className,
}: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 90, damping: 18, mass: 0.6 });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const text = useTransform(spring, (v) => {
    const n = v.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${prefix}${n}${suffix}`;
  });

  return <motion.span className={className}>{text}</motion.span>;
}
