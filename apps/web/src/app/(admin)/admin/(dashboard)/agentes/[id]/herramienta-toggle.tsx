"use client";

import { useTransition } from "react";
import { cn } from "@autoking/ui";
import { actualizarHerramientaAction } from "../actions";
import type { Herramienta } from "@/lib/control";

const CONFIRMACIONES = [
  { value: "never", label: "Sin confirmación" },
  { value: "customer", label: "Confirma el cliente" },
  { value: "operator", label: "Confirma un operador" },
];

const SCOPES = [
  { value: "tenant", label: "Solo sus datos" },
  { value: "global", label: "Sin restricción" },
];

/**
 * Fila de herramienta: permitir/denegar, nivel de confirmación y alcance.
 *
 * Muestra además si la herramienta tiene un adapter que la ejecute. Una tool
 * permitida sin adapter se ve verde acá y responde `notImplemented` en la
 * conversación — es la confusión más cara del sistema, así que se avisa.
 */
export function HerramientaToggle({ agentId, h }: { agentId: string; h: Herramienta }) {
  const [pending, start] = useTransition();
  const scope = h.scope ?? "tenant";
  const sinAdapter = h.implementada === false;

  const enviar = (allow: boolean, confirmation: string, nuevoScope: string) => {
    const fd = new FormData();
    fd.set("id", agentId);
    fd.set("tool", h.tool);
    fd.set("allow", String(allow));
    fd.set("confirmation", confirmation);
    fd.set("scope", nuevoScope);
    start(() => {
      actualizarHerramientaAction(fd);
    });
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border p-3",
        h.permitida ? "border-[var(--line)] bg-[var(--color-bg-2)]" : "border-dashed border-[var(--line)] opacity-70",
      )}
    >
      <button
        type="button"
        disabled={pending}
        onClick={() => enviar(!h.permitida, h.confirmacion === "forbidden" ? "never" : h.confirmacion, scope)}
        title={h.permitida ? "Quitar el permiso" : "Permitir esta herramienta"}
        className={cn(
          "h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-50",
          h.permitida ? "bg-[var(--color-success)]" : "bg-[var(--line-strong)]",
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-white transition-transform",
            h.permitida ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm font-medium text-white">{h.tool}</code>
          <span className="text-[11px] text-[var(--color-faint)]">{h.port}</span>
          {sinAdapter && (
            <span
              title="No hay adapter para su port: aunque esté permitida, en la conversación responde notImplemented."
              className="rounded-full border border-[var(--color-danger)]/40 bg-[rgb(255_80_80_/_0.08)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-danger)]"
            >
              sin implementar
            </span>
          )}
        </div>
        <div className="truncate text-xs text-[var(--color-muted)]">{h.descripcion}</div>
        {!h.permitida && h.motivo && (
          <div className="mt-0.5 text-[11px] text-[var(--color-faint)]">{h.motivo}</div>
        )}
        {h.permitida && sinAdapter && (
          <div className="mt-1 text-[11px] text-[var(--color-danger)]">
            Está permitida pero nadie la ejecuta. Necesita un adapter en la plataforma.
          </div>
        )}
      </div>

      {h.permitida && (
        <>
          <select
            disabled={pending}
            defaultValue={h.confirmacion}
            onChange={(e) => enviar(true, e.target.value, scope)}
            title="Quién tiene que confirmar antes de ejecutarla"
            className="flex-none rounded-lg border border-[var(--line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-xs text-white outline-none focus:border-blue-bright disabled:opacity-50"
          >
            {CONFIRMACIONES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <select
            disabled={pending}
            defaultValue={scope}
            onChange={(e) => enviar(true, h.confirmacion, e.target.value)}
            title="Alcance: acotada a los datos de su tenant, o sin restricción"
            className={cn(
              "flex-none rounded-lg border bg-[var(--color-bg-2)] px-2 py-1.5 text-xs outline-none focus:border-blue-bright disabled:opacity-50",
              scope === "global"
                ? "border-[var(--color-gold)]/50 text-[var(--color-gold)]"
                : "border-[var(--line)] text-white",
            )}
          >
            {SCOPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
