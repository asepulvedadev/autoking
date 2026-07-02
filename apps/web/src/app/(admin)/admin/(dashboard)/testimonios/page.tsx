import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@autoking/ui";
import type { Testimonio } from "./testimonio-form";

export default async function TestimoniosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonios")
    .select("*")
    .order("sort_order", { ascending: true });
  const items = (data ?? []) as Testimonio[];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(24px,4vw,32px)] font-extrabold text-white">Testimonios</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Se muestran en la landing. {items.length} en total.</p>
        </div>
        <Link
          href="/admin/testimonios/nuevo"
          className="rounded-full bg-gradient-to-br from-blue-bright to-blue-deep px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-blue)] transition-transform hover:-translate-y-0.5"
        >
          + Nuevo
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-12 text-center">
          <p className="text-[var(--color-muted)]">Sin testimonios todavía.</p>
          <Link href="/admin/testimonios/nuevo" className="mt-3 inline-block text-sm font-semibold text-blue-bright hover:underline">
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--line)]">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--color-bg-2)] text-left text-[var(--color-faint)]">
                <th className="p-4 font-medium">Autor</th>
                <th className="p-4 font-medium">Testimonio</th>
                <th className="p-4 font-medium">★</th>
                <th className="p-4 font-medium">Estado</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((tm) => (
                <tr key={tm.id} className="border-b border-[var(--line)] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-medium text-white">{tm.author_name}</div>
                    <div className="text-xs text-[var(--color-faint)]">{tm.author_role ?? ""}</div>
                  </td>
                  <td className="max-w-sm truncate p-4 text-[var(--color-muted)]">{tm.quote}</td>
                  <td className="p-4 text-[var(--color-gold)]">{"★".repeat(tm.rating)}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
                        tm.published
                          ? "border-[rgb(43_212_123_/_0.3)] bg-[rgb(43_212_123_/_0.14)] text-[var(--color-success)]"
                          : "border-[var(--line)] bg-white/[0.05] text-[var(--color-faint)]",
                      )}
                    >
                      {tm.published ? "Publicado" : "Borrador"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/testimonios/${tm.id}`} className="text-sm font-semibold text-blue-bright hover:underline">
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
