import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@autoking/ui";
import { ESTADOS, PLANES, type Cliente } from "./cliente-form";

const STATUS_STYLES: Record<string, string> = {
  activo: "bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)] border-[rgb(43_212_123_/_0.3)]",
  prueba: "bg-blue/[0.12] text-blue-bright border-[rgb(30_107_255_/_0.3)]",
  pausado: "bg-[rgb(255_176_32_/_0.14)] text-[var(--color-gold)] border-[rgb(255_176_32_/_0.3)]",
  cancelado: "bg-[rgb(255_80_80_/_0.12)] text-[var(--color-danger)] border-[rgb(255_90_90_/_0.3)]",
};

function labelOf(list: { value: string; label: string }[], value: string | null) {
  return list.find((x) => x.value === value)?.label ?? "—";
}

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });
  const clientes = (data ?? []) as Cliente[];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Clientes</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{clientes.length} negocio(s) registrado(s).</p>
        </div>
        <Link
          href="/admin/clientes/nuevo"
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-blue)] transition-transform hover:-translate-y-0.5"
        >
          + Nuevo cliente
        </Link>
      </div>

      {clientes.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center">
          <p className="text-[var(--color-muted)]">Todavía no hay clientes.</p>
          <Link href="/admin/clientes/nuevo" className="mt-3 inline-block text-sm font-semibold text-blue-bright hover:underline">
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--line)]">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--color-bg-2)] text-left text-[var(--color-faint)]">
                <th className="p-4 font-medium">Negocio</th>
                <th className="p-4 font-medium">Contacto</th>
                <th className="p-4 font-medium">WhatsApp</th>
                <th className="p-4 font-medium">Plan</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4 font-medium text-white">{c.business_name}</td>
                  <td className="p-4 text-[var(--color-muted)]">{c.contact_name ?? "—"}</td>
                  <td className="p-4 text-[var(--color-muted)]">{c.whatsapp ?? "—"}</td>
                  <td className="p-4 text-[var(--color-muted)]">{labelOf(PLANES, c.plan)}</td>
                  <td className="p-4">
                    <span className={cn("inline-block rounded-full border px-2.5 py-1 text-xs font-medium", STATUS_STYLES[c.status] ?? "")}>
                      {labelOf(ESTADOS, c.status)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/clientes/${c.id}`} className="text-sm font-semibold text-blue-bright hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
