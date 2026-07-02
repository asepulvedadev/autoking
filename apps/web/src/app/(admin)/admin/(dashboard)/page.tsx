import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const CARDS = [
  { label: "Clientes", value: "—", note: "Próximamente" },
  { label: "Citas agendadas", value: "—", note: "Próximamente" },
  { label: "Agentes activos", value: "—", note: "Próximamente" },
];

export default async function AdminHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
  const name = (profile?.full_name || user?.email || "Admin").split(" ")[0];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-[clamp(26px,4vw,34px)] font-extrabold text-white">Hola, {name} 👋</h1>
      <p className="mt-2 text-[var(--color-muted)]">Este es tu panel de administración de AutoKing.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.label} className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--color-surface)] p-5">
            <div className="text-sm text-[var(--color-muted)]">{c.label}</div>
            <div className="mt-1 font-display text-3xl font-extrabold text-white">{c.value}</div>
            <div className="mt-1 text-xs text-[var(--color-faint)]">{c.note}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-[var(--radius-card)] border border-[rgb(30_107_255_/_0.25)] bg-blue/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-white">Completá tu perfil</div>
          <div className="text-sm text-[var(--color-muted)]">Mantené tus datos personales al día.</div>
        </div>
        <Link
          href="/admin/perfil"
          className="rounded-full border border-blue-bright px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue/[0.12]"
        >
          Ir a mi perfil →
        </Link>
      </div>
    </div>
  );
}
