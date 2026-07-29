"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@autoking/ui";
import { generarSetupLinkAction, verificarConexionAction } from "../actions";

type WaStatus = "sin_conectar" | "pendiente" | "conectado";

export type WhatsappInfo = {
  clienteId: string;
  waStatus: WaStatus;
  setupUrl: string | null;
  expiresAt: string | null;
  phoneNumberId: string | null;
};

function submit(action: (fd: FormData) => Promise<void>, clienteId: string, start: (cb: () => void) => void) {
  const fd = new FormData();
  fd.set("clienteId", clienteId);
  start(() => {
    action(fd);
  });
}

export function WhatsappSection({ clienteId, waStatus, setupUrl, expiresAt, phoneNumberId }: WhatsappInfo) {
  const [pending, start] = useTransition();
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    if (!setupUrl) return;
    await navigator.clipboard.writeText(setupUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const vencido = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  const conectado = waStatus === "conectado";

  return (
    <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">🟢</span>
        <h2 className="font-semibold text-white">WhatsApp del cliente</h2>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            conectado
              ? "border border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]"
              : waStatus === "pendiente"
                ? "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                : "border border-[var(--line)] text-[var(--color-faint)]",
          )}
        >
          {conectado ? "Conectado" : waStatus === "pendiente" ? "Esperando al cliente" : "Sin conectar"}
        </span>
      </div>

      {conectado ? (
        <>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            El cliente conectó su WhatsApp Business. Su número ya puede recibir mensajes y atenderlos con su agente.
          </p>
          <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-xs text-[var(--color-faint)]">
            phone_number_id: <span className="text-white">{phoneNumberId}</span>
          </div>
          <Link
            href="/admin/infraestructura"
            className="mt-4 inline-block rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-white"
          >
            Ver / activar su agente en Infraestructura →
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            El cliente conecta su propio WhatsApp Business con un link seguro (embedded signup de Meta). No necesita
            darte contraseñas ni códigos: autoriza desde su cuenta.
          </p>

          {setupUrl && !vencido && (
            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] p-2">
                <input
                  readOnly
                  value={setupUrl}
                  className="min-w-0 flex-1 bg-transparent px-2 text-xs text-[var(--color-muted)] outline-none"
                />
                <button
                  type="button"
                  onClick={copiar}
                  className="flex-none rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/[0.12]"
                >
                  {copiado ? "¡Copiado!" : "Copiar link"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[var(--color-faint)]">
                Enviale este link al cliente por WhatsApp o email.
                {expiresAt && ` Vence el ${new Date(expiresAt).toLocaleString("es-CO")}.`}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => submit(generarSetupLinkAction, clienteId, start)}
              className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-cta transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {pending ? "..." : setupUrl && !vencido ? "Regenerar link" : "Generar link de conexión"}
            </button>
            {setupUrl && (
              <button
                type="button"
                disabled={pending}
                onClick={() => submit(verificarConexionAction, clienteId, start)}
                className="rounded-full border border-[var(--line)] px-4 py-2.5 text-sm text-[var(--color-muted)] transition-colors hover:text-white disabled:opacity-50"
              >
                Verificar conexión
              </button>
            )}
          </div>
          {vencido && setupUrl && (
            <p className="mt-2 text-xs text-amber-300">El link anterior venció. Generá uno nuevo.</p>
          )}
        </>
      )}
    </div>
  );
}
