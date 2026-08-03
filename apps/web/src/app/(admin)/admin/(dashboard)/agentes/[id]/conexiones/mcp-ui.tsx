"use client";

import { useActionState, useState } from "react";
import { cn } from "@autoking/ui";
import type { McpServer } from "@/lib/control";
import {
  conectarMcp,
  desconectarMcp,
  probarConexion,
  autorizarMcp,
  cambiarAsignacion,
  type McpState,
} from "./mcp-actions";

const campo =
  "w-full rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-bright";
const label = "mb-1 block text-xs font-medium text-[var(--color-muted)]";

/** Atajos para los MCP más usados: se completa el formulario y listo. */
const PLANTILLAS: Record<string, { tipo: "stdio" | "http"; command?: string; args?: string; env?: string; url?: string; auth?: string }> = {
  "Google Drive / Gmail / Calendar (OAuth)": { tipo: "http", url: "https://mcp.google.com/", auth: "oauth" },
  "Notion (OAuth)": { tipo: "http", url: "https://mcp.notion.com/mcp", auth: "oauth" },
  "Slack (OAuth)": { tipo: "http", url: "https://mcp.slack.com/mcp", auth: "oauth" },
  "Stripe (API key)": { tipo: "stdio", command: "npx", args: "-y\n@stripe/mcp\n--tools=all", env: "STRIPE_SECRET_KEY=" },
  "Filesystem (local)": { tipo: "stdio", command: "npx", args: "-y\n@modelcontextprotocol/server-filesystem\n/root/datos" },
  "Otro (manual)": { tipo: "stdio" },
};

export function ConectarMcp() {
  const [state, action, pending] = useActionState<McpState, FormData>(conectarMcp, {});
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<"stdio" | "http">("stdio");
  const [plantilla, setPlantilla] = useState("Otro (manual)");
  const p = PLANTILLAS[plantilla]!;

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta"
      >
        + Conectar un MCP
      </button>
    );
  }

  return (
    <form action={action} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
      <div>
        <label className={label} htmlFor="plantilla">Empezar desde</label>
        <select
          id="plantilla"
          value={plantilla}
          onChange={(e) => {
            setPlantilla(e.target.value);
            setTipo(PLANTILLAS[e.target.value]!.tipo);
          }}
          className={campo}
        >
          {Object.keys(PLANTILLAS).map((k) => <option key={k}>{k}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="nombre">Nombre corto *</label>
          <input id="nombre" name="nombre" required placeholder="notion" className={campo} />
        </div>
        <div>
          <label className={label} htmlFor="tipo">Cómo se conecta</label>
          <select id="tipo" name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "stdio" | "http")} className={campo}>
            <option value="stdio">Comando local (stdio)</option>
            <option value="http">Servidor remoto (HTTP)</option>
          </select>
        </div>
      </div>

      {tipo === "http" ? (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className={label} htmlFor="url">URL del servidor *</label>
            <input id="url" name="url" defaultValue={p.url ?? ""} placeholder="https://mcp.ejemplo.com/mcp" className={campo} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <input type="checkbox" name="auth" value="oauth" defaultChecked={p.auth === "oauth"} className="h-4 w-4 accent-[color:var(--color-success)]" />
            Usa OAuth (te vamos a dar un link para autorizar)
          </label>
          <div>
            <label className={label} htmlFor="headers">Headers (uno por línea, <code>Clave=Valor</code>)</label>
            <textarea id="headers" name="headers" rows={2} placeholder="Authorization=Bearer xxx" className={`${campo} resize-y font-mono text-xs`} />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <label className={label} htmlFor="command">Comando *</label>
            <input id="command" name="command" defaultValue={p.command ?? ""} placeholder="npx" className={campo} />
          </div>
          <div>
            <label className={label} htmlFor="args">Argumentos (uno por línea)</label>
            <textarea id="args" name="args" rows={3} defaultValue={p.args ?? ""} placeholder={"-y\n@modelcontextprotocol/server-xxx"} className={`${campo} resize-y font-mono text-xs`} />
          </div>
          <div>
            <label className={label} htmlFor="env">Variables de entorno (<code>CLAVE=valor</code>)</label>
            <textarea id="env" name="env" rows={2} defaultValue={p.env ?? ""} placeholder="API_KEY=..." className={`${campo} resize-y font-mono text-xs`} />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Conectando…" : "Conectar"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="text-sm text-[var(--color-muted)] hover:text-white">Cancelar</button>
        {state.ok && <span className="text-sm text-[var(--color-success)]">{state.detalle}</span>}
        {state.error && <span className="text-sm text-[var(--color-danger)]">{state.error}</span>}
      </div>
    </form>
  );
}

export function ServidorMcp({ s, agentes }: { s: McpServer; agentes: string[] }) {
  const [probe, probeAction, probando] = useActionState<McpState, FormData>(probarConexion, {});
  const [auth, authAction, autorizando] = useActionState<McpState, FormData>(autorizarMcp, {});

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xl">🔌</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{s.nombre}</span>
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">{s.tipo}</span>
            {s.auth === "oauth" && (
              <span className="rounded-full border border-[rgb(255_193_7_/_0.3)] px-2 py-0.5 text-[11px] text-[var(--color-gold)]">OAuth</span>
            )}
          </div>
          <div className="truncate text-xs text-[var(--color-faint)]">{s.url ?? s.command ?? "—"}</div>
        </div>

        <form action={probeAction} className="flex-none">
          <input type="hidden" name="nombre" value={s.nombre} />
          <button type="submit" disabled={probando} className="text-xs font-medium text-blue-bright hover:underline disabled:opacity-60">
            {probando ? "Probando…" : "Probar"}
          </button>
        </form>

        <form action={desconectarMcp} className="flex-none">
          <input type="hidden" name="nombre" value={s.nombre} />
          <button
            type="submit"
            onClick={(e) => { if (!confirm(`¿Desconectar "${s.nombre}"? Los agentes pierden sus herramientas.`)) e.preventDefault(); }}
            className="text-xs text-[var(--color-faint)] hover:text-[var(--color-danger)]"
          >
            Desconectar
          </button>
        </form>
      </div>

      {/* Autorización OAuth en dos pasos */}
      {s.auth === "oauth" && (
        <form action={authAction} className="mt-3 rounded-xl border border-[rgb(255_193_7_/_0.25)] bg-[rgb(255_193_7_/_0.04)] p-3">
          <input type="hidden" name="nombre" value={s.nombre} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={autorizando} className="rounded-full bg-[var(--color-gold)] px-4 py-1.5 text-xs font-semibold text-black disabled:opacity-60">
              {autorizando ? "…" : "Autorizar"}
            </button>
            <input name="code" placeholder="pegá acá el código que te devuelva" className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--color-bg-2)] px-3 py-1.5 text-xs text-white outline-none" />
          </div>
          {auth.url && (
            <p className="mt-2 break-all text-xs">
              <a href={auth.url} target="_blank" rel="noopener" className="text-blue-bright underline">
                {auth.url}
              </a>
            </p>
          )}
          {auth.detalle && <p className="mt-1 text-xs text-[var(--color-muted)]">{auth.detalle}</p>}
          {auth.error && <p className="mt-1 text-xs text-[var(--color-danger)]">{auth.error}</p>}
        </form>
      )}

      {(probe.detalle || probe.error) && (
        <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-[var(--color-bg-2)] p-3 text-[11px] text-[var(--color-muted)]">
          {probe.error ?? probe.detalle}
        </pre>
      )}

      {/* Qué agentes lo pueden usar */}
      <div className="mt-4">
        <div className="text-xs font-medium text-[var(--color-muted)]">Agentes que lo pueden usar</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {agentes.map((a) => {
            const activo = s.agentes.includes(a);
            return (
              <form key={a} action={cambiarAsignacion}>
                <input type="hidden" name="nombre" value={s.nombre} />
                <input type="hidden" name="agentId" value={a} />
                <input type="hidden" name="permitir" value={String(!activo)} />
                <button
                  type="submit"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    activo
                      ? "border-[rgb(43_212_123_/_0.4)] bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]"
                      : "border-[var(--line)] text-[var(--color-faint)] hover:border-[var(--line-strong)]",
                  )}
                >
                  {activo ? "✓ " : "+ "}{a}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
