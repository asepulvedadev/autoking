import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";
import { EstadoAgente } from "./estado-agente";

export const dynamic = "force-dynamic";

function Tarjeta({ href, icono, titulo, dato, pie }: { href: string; icono: string; titulo: string; dato: string; pie: string }) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5 transition-colors hover:border-blue-bright/40"
    >
      <div className="text-2xl">{icono}</div>
      <div className="mt-2 font-display text-2xl font-extrabold text-white">{dato}</div>
      <div className="text-sm font-medium text-white">{titulo}</div>
      <div className="mt-0.5 text-xs text-[var(--color-faint)]">{pie}</div>
    </Link>
  );
}

export default async function PanelInicioPage() {
  const agente = await miAgente();
  if (!agente) redirect("/panel");

  const supabase = await createClient();

  // Todo acotado al agente. RLS ya lo garantiza, pero el filtro explícito hace
  // que la intención se lea en el código y no dependa solo de la política.
  const [{ count: conocimiento }, { count: creativos }, { count: citas }] = await Promise.all([
    supabase.from("knowledge_base").select("id", { count: "exact", head: true }).eq("agente_id", agente.id),
    supabase.from("agente_assets").select("id", { count: "exact", head: true }).eq("agente_id", agente.id),
    supabase
      .from("citas")
      .select("id", { count: "exact", head: true })
      .eq("agente_id", agente.id)
      .gte("inicio", new Date().toISOString())
      .in("estado", ["pendiente", "confirmada"]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <EstadoAgente activo={agente.estado === "activo"} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Tarjeta
          href="/panel/conversaciones"
          icono="💬"
          titulo="Conversaciones"
          dato="Ver"
          pie="lo que habla tu agente"
        />
        <Tarjeta
          href="/panel/conocimiento"
          icono="📚"
          titulo="Conocimiento"
          dato={String(conocimiento ?? 0)}
          pie="cosas que sabe de tu negocio"
        />
        <Tarjeta
          href="/panel/agenda"
          icono="📅"
          titulo="Citas próximas"
          dato={String(citas ?? 0)}
          pie="agendadas de aquí en adelante"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Tarjeta
          href="/panel/creativos"
          icono="🖼️"
          titulo="Creativos"
          dato={String(creativos ?? 0)}
          pie="imágenes y documentos que puede enviar"
        />
        <Tarjeta
          href="/panel/negocio"
          icono="⚙️"
          titulo="Mi negocio"
          dato="Editar"
          pie="cómo se presenta y qué ofrece"
        />
      </div>

      <p className="text-center text-xs text-[var(--color-faint)]">
        ¿Algo no anda como esperabas? Escríbenos y lo revisamos.
      </p>
    </div>
  );
}
