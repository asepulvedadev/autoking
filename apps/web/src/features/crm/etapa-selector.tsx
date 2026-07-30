"use client";

import { useState, useTransition } from "react";
import { cn } from "@autoking/ui";
import { ETAPAS, etapaInfo } from "./pipeline";
import { moverEtapa } from "./actions";

/**
 * Mover un lead de etapa.
 *
 * Las etapas se muestran como una fila de pasos y no como un `<select>`:
 * el pipeline se entiende mirándolo, y un desplegable esconde justamente lo
 * que importa —dónde está y cuánto le falta.
 */
export function EtapaSelector({
  leadId,
  etapa,
  motivoPerdida,
}: {
  leadId: string;
  etapa: string;
  motivoPerdida: string | null;
}) {
  const [pendiente, startTransition] = useTransition();
  const [actual, setActual] = useState(etapa);
  const [error, setError] = useState<string | null>(null);
  // Al marcar "perdido" se pide el motivo antes de guardar: preguntarlo
  // después nunca funciona, nadie vuelve a completarlo.
  const [pidiendoMotivo, setPidiendoMotivo] = useState(false);
  const [motivo, setMotivo] = useState(motivoPerdida ?? "");

  function mover(nueva: string, motivoTexto?: string) {
    setError(null);
    const previa = actual;
    setActual(nueva); // optimista: el click se siente inmediato
    startTransition(async () => {
      const r = await moverEtapa(leadId, nueva, motivoTexto);
      if (r?.error) {
        setActual(previa); // se revierte si la base lo rechazó
        setError(r.error);
      } else {
        setPidiendoMotivo(false);
      }
    });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Etapa</h2>
        {pendiente && <span className="text-xs text-faint">guardando…</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {ETAPAS.map((e) => {
          const activa = e.value === actual;
          return (
            <button
              key={e.value}
              type="button"
              disabled={pendiente}
              title={e.ayuda}
              onClick={() => (e.value === "perdido" ? setPidiendoMotivo(true) : mover(e.value))}
              className={cn(
                "rounded-[var(--radius-sm)] border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60",
                activa ? e.color : "border-line text-muted hover:border-line-strong hover:text-white",
              )}
            >
              {e.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-faint">{etapaInfo(actual).ayuda}</p>

      {pidiendoMotivo && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-line bg-bg-2 p-3">
          <label className="text-xs text-muted" htmlFor="motivo">
            ¿Por qué se perdió? Esto es lo que sirve después para saber qué arreglar.
          </label>
          <input
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="precio, timing, se fue con otro, no contestó…"
            className="mt-2 w-full rounded-[var(--radius-sm)] border border-line bg-surface px-3 py-2 text-sm text-white outline-none focus:border-blue-bright"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => mover("perdido", motivo)}
              disabled={pendiente}
              className="rounded-[var(--radius-sm)] bg-blue px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Marcar perdido
            </button>
            <button
              type="button"
              onClick={() => setPidiendoMotivo(false)}
              className="rounded-[var(--radius-sm)] border border-line px-3 py-1.5 text-xs text-muted hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {actual === "perdido" && motivoPerdida && !pidiendoMotivo && (
        <p className="mt-3 text-xs text-muted">
          Motivo: <span className="text-white">{motivoPerdida}</span>
        </p>
      )}

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
    </div>
  );
}
