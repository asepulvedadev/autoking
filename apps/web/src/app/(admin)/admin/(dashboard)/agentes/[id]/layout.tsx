import { redirect } from "next/navigation";
import Link from "next/link";
import { agenteAccesible } from "@/lib/agentes";
import { AgenteTabs } from "./agente-tabs";

/**
 * Cáscara común de un agente: guard de acceso + cabecera + pestañas.
 *
 * El guard vive acá y no en cada página: todo lo que cuelgue de
 * /admin/agentes/[id] queda protegido por herencia. Un vendedor atado a Mayand
 * que escriba /admin/agentes/king a mano rebota al listado.
 */
export default async function AgenteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agente = await agenteAccesible(id);
  if (!agente) redirect("/admin/agentes");

  const bandera = agente.pais === "mexico" ? "🇲🇽" : agente.pais === "colombia" ? "🇨🇴" : "🌎";

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/agentes" className="text-sm text-[var(--color-muted)] hover:text-white">
        ← Agentes
      </Link>

      <header className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[clamp(22px,4vw,30px)] font-extrabold text-white">
          {bandera} {agente.nombre ?? agente.slug}
        </h1>
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[var(--color-gold)]">
          {agente.slug}
        </code>
        {agente.estado !== "activo" && (
          <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
            {agente.estado}
          </span>
        )}
      </header>

      {agente.whatsapp_display && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Atiende <b className="text-white">{agente.whatsapp_display}</b>
        </p>
      )}

      <AgenteTabs id={agente.slug} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
