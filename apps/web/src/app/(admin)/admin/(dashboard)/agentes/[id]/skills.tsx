"use client";

import { useActionState, useState } from "react";
import { ZonaSubida } from "@/components/zona-subida";
import { subirSkill, eliminarSkill, type SkillState } from "./skills-actions";

const campo =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-bright";

/**
 * Gestión de skills del agente. Solo para el equipo de AutoKing: una skill son
 * instrucciones que el agente obedece, así que cargarla es cambiar su conducta.
 */
export function Skills({ agentId, skills }: { agentId: string; skills: string[] }) {
  const [state, action, pending] = useActionState<SkillState, FormData>(subirSkill, {});
  const [modo, setModo] = useState<"cerrado" | "archivo" | "texto">("cerrado");

  return (
    <div>
      <div className="flex flex-col gap-2">
        {skills.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Este agente no tiene skills cargadas.</p>
        ) : (
          skills.map((s) => {
            const [slug, version] = s.split("@");
            return (
              <div key={s} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--color-surface)] px-4 py-3">
                <span className="text-lg">🧩</span>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-white">{slug}</span>
                  <span className="ml-2 text-xs text-[var(--color-faint)]">v{version ?? "—"}</span>
                </div>
                <form action={eliminarSkill}>
                  <input type="hidden" name="agentId" value={agentId} />
                  <input type="hidden" name="slug" value={slug ?? ""} />
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm(`¿Quitar la skill "${slug}"? El agente deja de seguir esas instrucciones.`)) e.preventDefault();
                    }}
                    className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]"
                  >
                    Quitar
                  </button>
                </form>
              </div>
            );
          })
        )}
      </div>

      {modo === "cerrado" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setModo("archivo")}
            className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta"
          >
            📦 Subir skill (.zip o .md)
          </button>
          <button
            onClick={() => setModo("texto")}
            className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-medium text-white hover:border-blue-bright/50"
          >
            ✍️ Escribirla acá
          </button>
        </div>
      ) : (
        <form action={action} className="mt-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
          <input type="hidden" name="agentId" value={agentId} />

          {modo === "archivo" ? (
            <>
              <p className="text-sm text-[var(--color-muted)]">
                Un <b className="text-white">.zip con SKILL.md adentro</b> (como los de Claude) o
                directamente un <b className="text-white">.md</b>.
              </p>
              <div className="mt-3">
                <ZonaSubida accept=".zip,.md,.markdown,.txt" maxMB={4} ayuda=".zip o .md" />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]" htmlFor="instrucciones">
                Instrucciones (markdown)
              </label>
              <textarea
                id="instrucciones"
                name="instrucciones"
                rows={10}
                placeholder={"# Cómo manejar reclamos\n\nCuando alguien se queje…"}
                className={`${campo} resize-y font-mono text-xs`}
              />
            </div>
          )}

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input name="nombre" required placeholder="Nombre (ej: Manejo de reclamos)" className={campo} />
            <input name="slug" placeholder="id (opcional, se genera solo)" className={campo} />
            <input name="version" defaultValue="0.1.0" placeholder="versión" className={campo} />
          </div>
          <input name="descripcion" placeholder="Para qué sirve (opcional)" className={`${campo} mt-3`} />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Instalando…" : "Instalar skill"}
            </button>
            <button type="button" onClick={() => setModo("cerrado")} className="text-sm text-[var(--color-muted)] hover:text-white">
              Cancelar
            </button>
            {state.ok && <span className="text-sm text-[var(--color-success)]">{state.detalle ?? "Instalada ✅"}</span>}
            {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
