import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@autoking/ui";
import { listarPackages, type PackageResumen } from "@/lib/control";
import { getSessionProfile } from "@/lib/session";
import { agentesDelUsuario } from "@/lib/agentes";
import { isPrivileged } from "@/lib/roles";
import { NuevoAgente } from "./nuevo-agente";

export const dynamic = "force-dynamic";

/**
 * Listado de agentes que el usuario tiene permitido ver.
 *
 * No filtra por ROL sino por MEMBRESÍA: un vendedor atado a Mayand ve un solo
 * agente; el staff del tenant los ve todos. Adentro de cada uno están sus
 * conversaciones, leads, prospección y creativos.
 */
export default async function PlataformaAgentesPage() {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");

  const agentes = await agentesDelUsuario();
  const puedeCrear = isPrivileged(me.role);

  // Datos del AgentPackage (skills, tools) — solo informativos y solo para staff
  // privilegiado, que es quien configura. Si el VPS no responde, la lista igual sale.
  let packages: PackageResumen[] = [];
  if (puedeCrear) {
    try {
      packages = await listarPackages();
    } catch {
      /* la lista de la DB es la fuente de verdad; el detalle del VPS es opcional */
    }
  }
  const infoDe = (slug: string) => packages.find((p) => p.id === slug);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">
        {agentes.length === 1 ? "Mi agente" : "Agentes"}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Cada agente es una <b className="text-white">unidad autocontenida</b>: su número, sus conversaciones,
        sus leads, su prospección, sus creativos y su conocimiento. Entrá a uno para trabajarlo.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {agentes.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--color-muted)]">
            No tenés ningún agente asignado. Pedile a un administrador que te dé acceso.
          </div>
        ) : (
          agentes.map((a) => {
            const info = infoDe(a.slug);
            const bandera = a.pais === "mexico" ? "🇲🇽" : a.pais === "colombia" ? "🇨🇴" : "🌎";
            return (
              <Link
                key={a.id}
                href={`/admin/agentes/${a.slug}`}
                className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-blue-bright/40"
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[var(--color-bg-2)] text-lg">
                  {bandera}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{a.nombre ?? a.slug}</span>
                    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-[var(--color-gold)]">
                      {a.slug}
                    </code>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        a.estado === "activo"
                          ? "bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)] border-[rgb(43_212_123_/_0.3)]"
                          : "border-[var(--line-strong)] text-[var(--color-muted)]",
                      )}
                    >
                      {a.estado}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-faint)]">
                    {a.whatsapp_display ?? "sin número vinculado"}
                    {info ? ` · ${info.skills.length} skill(s) · ${info.toolsPermitidas} herramienta(s)` : ""}
                  </div>
                </div>
                <span className="flex-none text-sm text-blue-bright">Entrar →</span>
              </Link>
            );
          })
        )}
      </div>

      {puedeCrear && <NuevoAgente />}
    </div>
  );
}
