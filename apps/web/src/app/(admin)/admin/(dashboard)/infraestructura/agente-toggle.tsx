"use client";

import { useTransition } from "react";
import { cn } from "@autoking/ui";
import { toggleAgenteAction } from "./actions";

/** Switch para prender/apagar el agente de un cliente (WhatsApp sigue normal si está off). */
export function AgenteToggle({ id, activo }: { id: string; activo: boolean }) {
  const [pending, start] = useTransition();

  const toggle = () => {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("activo", String(!activo));
    start(() => {
      toggleAgenteAction(fd);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={activo}
      title={activo ? "Apagar agente (el WhatsApp sigue normal)" : "Encender agente"}
      className={cn(
        "relative h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-50",
        activo ? "bg-[var(--color-success)]" : "bg-[var(--line-strong)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          activo ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
