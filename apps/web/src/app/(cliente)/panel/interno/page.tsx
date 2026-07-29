import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";
import { AgregarInterno, InternoFila, type Interno } from "./interno-ui";

export const dynamic = "force-dynamic";

export default async function PanelInternoPage() {
  const agente = await miAgente();
  if (!agente) redirect("/panel");

  const supabase = await createClient();
  const { data } = await supabase
    .from("agente_secretos")
    .select("id, clave, valor, descripcion, visibilidad")
    .eq("agente_id", agente.id)
    .eq("activo", true)
    .order("clave");

  return (
    <div>
      <h1 className="font-display text-[clamp(22px,4vw,28px)] font-extrabold text-white">Información interna</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Cosas que tu agente <b className="text-white">sabe pero no cuenta</b>: hasta cuánto puede
        descontar, tus márgenes, políticas que usa para decidir.
      </p>

      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-gold)]/40 bg-[rgb(255_193_7_/_0.05)] p-4 text-sm">
        <p className="font-medium text-[var(--color-gold)]">⚠️ Leé esto antes de cargar algo</p>
        <p className="mt-1 text-[var(--color-muted)]">
          Tu agente <b className="text-white">lee</b> esta información para poder decidir. Le indicamos
          que no la revele y solo la comparte con alguien de tu equipo, pero eso es una instrucción,
          no un candado. <b className="text-white">Nunca guardes acá contraseñas, API keys ni datos
          bancarios</b> — si necesitás conectar algo con credenciales, escribinos y lo dejamos en el
          servidor, fuera del alcance del agente.
        </p>
      </div>

      <div className="mt-6">
        <AgregarInterno />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {(data ?? []).length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--line-strong)] p-10 text-center text-sm text-[var(--color-muted)]">
            Todavía no cargaste nada. Un buen primer ejemplo: hasta qué descuento puede ofrecer sin
            consultarte.
          </div>
        ) : (
          (data as Interno[]).map((i) => <InternoFila key={i.id} i={i} />)
        )}
      </div>
    </div>
  );
}
