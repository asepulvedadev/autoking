import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";
import { miAgente } from "@/lib/agentes";
import { PanelNav } from "./panel-nav";

export const dynamic = "force-dynamic";

/**
 * Panel del CLIENTE — su espacio, separado de /admin.
 *
 * Acá el cliente ve y administra SOLO su agente: su conocimiento, sus
 * creativos, sus conversaciones, su agenda. La frontera no la pone este layout
 * sino la MEMBRESÍA + RLS: aunque alguien manipule una URL, la base no le
 * devuelve datos de otro tenant ni de otro agente.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");

  const agente = await miAgente();

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <header className="border-b border-[var(--line)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-4">
          <span className="font-display text-lg font-extrabold text-white">
            Auto<span className="text-blue-bright">King</span>
          </span>
          {agente && (
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--color-muted)]">
              {agente.nombre ?? agente.slug}
              {agente.whatsapp_display ? ` · ${agente.whatsapp_display}` : ""}
            </span>
          )}
          <span className="ml-auto text-sm text-[var(--color-muted)]">{me.full_name ?? me.email}</span>
        </div>
        <div className="mx-auto max-w-5xl px-5 pb-3">
          <PanelNav />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {!agente ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center">
            <p className="text-white">Todavía no tenés un agente asignado.</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Escribinos y lo dejamos andando.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
