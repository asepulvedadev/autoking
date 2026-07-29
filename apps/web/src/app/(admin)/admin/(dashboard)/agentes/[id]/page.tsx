import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cn } from "@autoking/ui";
import { getPackage } from "@/lib/control";
import { getSessionProfile } from "@/lib/session";
import { agenteAccesible } from "@/lib/agentes";
import { HerramientaToggle } from "./herramienta-toggle";
import { IdentidadEditor } from "./identidad-editor";
import { Creativos, type Recurso } from "./creativos";
import { Skills } from "./skills";
import { listarDocumentos } from "@/lib/documentos";
import { SubirDocumento, NuevoDocumento, DocumentoFila } from "@/features/documentos/documentos-ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function Seccion({ icono, titulo, sub, children }: { icono: string; titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icono}</span>
        <h2 className="font-semibold text-white">{titulo}</h2>
      </div>
      {sub && <p className="mt-1 text-sm text-[var(--color-muted)]">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

const Chip = ({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "ok" | "off" }) => (
  <span className={cn("inline-block rounded-full border px-2.5 py-1 text-xs",
    tone === "ok" ? "border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]"
      : tone === "off" ? "border-[var(--line)] text-[var(--color-faint)]"
      : "border-[var(--line)] text-[var(--color-muted)]")}>
    {children}
  </span>
);

export default async function AgenteConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionProfile();
  if (!me) redirect("/admin/login");

  const { id } = await params;
  // El acceso ya lo valida el layout, pero se repite acá: esta página lee datos,
  // y una página que lee datos no debe confiar en que otra la protegió.
  const agente = await agenteAccesible(id);
  if (!agente) redirect("/admin/agentes");

  const p = await getPackage(id);
  if (!p) notFound();

  const permitidas = p.herramientas.filter((h) => h.permitida);
  const denegadas = p.herramientas.filter((h) => !h.permitida);
  const runtime = p.policies?.runtime ?? {};

  const supabase = await createClient();

  // --- Conocimiento del agente ---
  // Dos niveles: la BASE COMPARTIDA del tenant (agente_id null) que ven todos los
  // agentes, más lo PROPIO de este agente. Se muestran juntos porque es lo que el
  // agente realmente consulta en una conversación.
  type Chunk = { id: string; titulo: string | null; contenido: string; agente_id: string | null };
  const { data: chunks } = await supabase
    .from("knowledge_base")
    .select("id, titulo, contenido, agente_id")
    .or(`agente_id.is.null,agente_id.eq.${agente.id}`)
    .limit(50);

  const rag = {
    propios: (chunks ?? []).filter((c) => c.agente_id).length,
    compartidos: (chunks ?? []).filter((c) => !c.agente_id).length,
  };

  // Los documentos son la FUENTE editable del RAG. Los chunks de arriba son
  // derivados: acá se edita el documento y se regeneran solos.
  const documentos = await listarDocumentos(agente.id);

  // --- Creativos: los de ESTE agente, no los del tenant entero ---
  const { data: assets } = await supabase
    .from("agente_assets")
    .select("id, slug, nombre, descripcion, tipo, url, activo")
    .eq("agente_id", agente.id)
    .order("created_at", { ascending: true });
  const creativos = (assets ?? []) as Recurso[];

  return (
    // El nombre, el número y las pestañas los pone el layout: acá solo va lo
    // propio de la configuración.
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Chip>{String(p.metadata?.type ?? "—")}</Chip>
        <Chip>v{String(p.metadata?.version ?? "—")}</Chip>
        <span className="text-xs text-[var(--color-faint)]">{p.dir}</span>
      </div>

      {/* 1. IDENTIDAD — editable */}
      <Seccion icono="🪪" titulo="Identidad" sub="Quién es el agente: su persona, su alma y su conocimiento base. Editable.">
        <IdentidadEditor agentId={p.id} identidad={p.identidad} />
      </Seccion>

      {/* 2. SKILLS — instrucciones que el agente obedece. Solo las carga el equipo. */}
      <Seccion
        icono="🎯"
        titulo={`Skills (${p.skills.length})`}
        sub="Instrucciones que el agente sigue. Subilas en .zip o .md, como en Claude."
      >
        <Skills
          agentId={p.id}
          skills={p.skills.map((s) => `${s.nombre}${s.version ? `@${s.version}` : ""}`)}
        />
      </Seccion>

      {/* 3. HERRAMIENTAS */}
      <Seccion
        icono="🔧"
        titulo={`Herramientas (${permitidas.length} de ${p.herramientas.length})`}
        sub="Qué acciones puede ejecutar. Se aplican de verdad: lo que esté apagado, el agente NO lo puede usar."
      >
        <div className="flex flex-col gap-2">
          {permitidas.map((h) => <HerramientaToggle key={h.tool} agentId={p.id} h={h} />)}
          {denegadas.length > 0 && (
            <>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--color-faint)]">Denegadas</p>
              {denegadas.map((h) => <HerramientaToggle key={h.tool} agentId={p.id} h={h} />)}
            </>
          )}
        </div>
      </Seccion>

      {/* 4. POLICIES / RUNTIME */}
      <Seccion icono="🛡️" titulo="Policies" sub="Qué tiene permitido a nivel runtime, y qué exige confirmación.">
        <div className="flex flex-wrap gap-2">
          {Object.entries(runtime).map(([k, v]) => (
            <Chip key={k} tone={v === "deny" ? "off" : "ok"}>{k}: {String(v)}</Chip>
          ))}
          {Object.keys(runtime).length === 0 && <Chip tone="off">sin restricciones declaradas</Chip>}
        </div>
        {p.policies.confirmaciones?.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1 text-xs text-[var(--color-muted)]">
            {p.policies.confirmaciones.map((c) => (
              <li key={c.action}>
                <code className="text-[var(--color-gold)]">{c.action}</code> → <b className="text-white">{c.confirmation}</b>
                {c.reason ? ` · ${c.reason}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {/* 5. CONEXIONES */}
      <Seccion icono="🔌" titulo="Conexiones" sub="Qué sistemas externos necesita.">
        <div className="flex flex-wrap gap-2">
          {(p.conexiones.declaradas || []).length === 0 ? <Chip tone="off">ninguna</Chip> :
            p.conexiones.declaradas.map((c) => <Chip key={c}>{c}</Chip>)}
        </div>
      </Seccion>

      {/* 6. CONOCIMIENTO (RAG) */}
      <Seccion icono="📚" titulo="Conocimiento (RAG)" sub="Qué sabe y de dónde lo saca.">
        <div className="flex flex-wrap gap-2">
          {(p.conocimiento.colecciones || []).length === 0 ? <Chip tone="off">sin colecciones</Chip> :
            p.conocimiento.colecciones.map((c) => <Chip key={c}>{c}</Chip>)}
        </div>

        <p className="mt-2 text-xs text-[var(--color-faint)]">
          <b className="text-[var(--color-muted)]">{rag.compartidos}</b> fragmento(s) de la base
          compartida de la empresa · <b className="text-[var(--color-muted)]">{rag.propios}</b> propios
          de este agente. La base compartida se edita una sola vez y la ven todos: así un precio no
          queda actualizado en un agente y viejo en el otro.
        </p>

        {/* Los DOCUMENTOS son la fuente editable; los chunks salen de acá. */}
        <div className="mt-4 flex flex-col gap-3">
          <SubirDocumento agentSlug={p.id} />
          <NuevoDocumento agentSlug={p.id} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {documentos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line-strong)] p-6 text-center text-sm text-[var(--color-muted)]">
              Sin documentos todavía. Subí un PDF o escribí uno: de ahí sale lo que el agente consulta.
            </div>
          ) : (
            documentos.map((d) => <DocumentoFila key={d.id} d={d} agentSlug={p.id} />)
          )}
        </div>
      </Seccion>

      {/* 7. MEMORIA */}
      <Seccion icono="🧠" titulo="Memoria" sub="Qué recuerda entre conversaciones.">
        <div className="flex flex-wrap gap-2">
          {Object.entries(p.memoria.declarada || {}).map(([k, v]) => (
            <Chip key={k} tone={v ? "ok" : "off"}>{k}: {String(v)}</Chip>
          ))}
          {Object.keys(p.memoria.declarada || {}).length === 0 && <Chip tone="off">sin memoria declarada</Chip>}
        </div>
      </Seccion>

      {/* 8. WORKFLOWS + capacidades */}
      <Seccion icono="⚙️" titulo="Workflows y capacidades" sub="Qué procesos sigue y qué formatos entiende.">
        <div className="flex flex-wrap gap-2">
          {(p.workflows || []).map((w) => (
            <Chip key={w.archivo} tone={w.existe ? "ok" : "off"}>{w.archivo.replace("./workflows/", "")}</Chip>
          ))}
          {Object.entries(p.runtime.capabilities || {}).map(([k, v]) => (
            <Chip key={k} tone={v ? "ok" : "off"}>{k}: {String(v)}</Chip>
          ))}
        </div>
      </Seccion>

      {/* 9. CREATIVOS — propios de este agente */}
      <Seccion icono="🖼️" titulo={`Creativos (${creativos.length})`} sub="Lo que ESTE agente puede enviar por WhatsApp. Cada agente tiene los suyos.">
        <Creativos agentId={p.id} agenteId={agente.id} recursos={creativos} />
      </Seccion>
    </>
  );
}
