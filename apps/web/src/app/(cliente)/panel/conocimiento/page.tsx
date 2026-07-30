import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";
import { listarDocumentos } from "@/lib/documentos";
import { SubirDocumento, NuevoDocumento, DocumentoFila } from "@/features/documentos/documentos-ui";

export const dynamic = "force-dynamic";

export default async function PanelConocimientoPage() {
  const agente = await miAgente();
  if (!agente) redirect("/panel");

  const documentos = await listarDocumentos(agente.id);

  // Conocimiento suelto: fragmentos viejos sin documento, y la base compartida
  // de AutoKing. No se editan acá — los primeros son historia, la segunda es
  // nuestra y se mantiene en un solo lugar para que no quede desfasada.
  const supabase = await createClient();
  const { data: sueltos } = await supabase
    .from("knowledge_base")
    .select("id, titulo, contenido, agente_id")
    .is("documento_id", null)
    .or(`agente_id.is.null,agente_id.eq.${agente.id}`)
    .eq("activo", true)
    .limit(60);

  const compartidos = (sueltos ?? []).filter((c) => !c.agente_id);

  return (
    <div>
      <h1 className="font-display text-[clamp(22px,4vw,28px)] font-extrabold text-white">Conocimiento</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Todo lo que tu agente sabe vive en <b className="text-white">documentos</b>. Subís un PDF o
        una foto, lo convertimos a texto editable, y de ahí tu agente saca las respuestas.
        Si cambia un precio, <b className="text-white">editás el documento</b> y listo.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <SubirDocumento />
        <NuevoDocumento />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-white">
        Tus documentos <span className="font-normal text-[var(--color-faint)]">({documentos.length})</span>
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        {documentos.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--color-muted)]">
            Todavía no hay documentos. Empezá subiendo tu lista de servicios y precios.
          </div>
        ) : (
          documentos.map((d) => <DocumentoFila key={d.id} d={d} />)
        )}
      </div>

      {compartidos.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold text-white">
            De AutoKing <span className="font-normal text-[var(--color-faint)]">({compartidos.length})</span>
          </h2>
          <p className="mt-1 text-xs text-[var(--color-faint)]">
            Cómo funciona el servicio. Lo mantenemos nosotros, por eso no se edita desde aquí.
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {compartidos.slice(0, 10).map((c) => (
              <div key={c.id} className="rounded-xl border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm">
                <span className="mr-2 text-[var(--color-faint)]">🔒</span>
                <b className="text-white">{c.titulo || "—"}</b>
                <span className="text-[var(--color-muted)]">: {String(c.contenido).slice(0, 110)}…</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
