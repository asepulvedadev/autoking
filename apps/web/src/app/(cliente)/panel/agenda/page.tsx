import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { miAgente } from "@/lib/agentes";
import { Citas, Servicios, Horarios, type Cita, type Servicio, type Horario } from "./agenda-ui";

export const dynamic = "force-dynamic";

export default async function PanelAgendaPage() {
  const agente = await miAgente();
  if (!agente) redirect("/panel");

  const supabase = await createClient();

  const [{ data: citas }, { data: servicios }, { data: horarios }, { data: tenant }] = await Promise.all([
    supabase
      .from("citas")
      .select("id, cliente_nombre, cliente_whatsapp, inicio, estado, servicios(nombre)")
      .eq("agente_id", agente.id)
      .gte("inicio", new Date(Date.now() - 12 * 3600_000).toISOString())
      .order("inicio")
      .limit(60),
    supabase.from("servicios").select("id, nombre, duracion_min, precio").eq("agente_id", agente.id).eq("activo", true).order("nombre"),
    supabase.from("horarios_atencion").select("id, dia_semana, abre, cierra").eq("agente_id", agente.id).eq("activo", true).order("dia_semana"),
    supabase.from("tenants").select("timezone").limit(1).single(),
  ]);

  const tz = (tenant?.timezone as string) ?? "America/Bogota";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-[clamp(22px,4vw,28px)] font-extrabold text-white">Agenda</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Las citas que agendó tu agente, y las reglas que usa para ofrecer turnos.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">Próximas citas</h2>
        <Citas citas={(citas ?? []) as Cita[]} tz={tz} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white">Servicios que se pueden agendar</h2>
        <p className="mb-3 mt-0.5 text-xs text-[var(--color-faint)]">
          La duración define cada cuánto se ofrece un turno.
        </p>
        <Servicios servicios={(servicios ?? []) as Servicio[]} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-white">Horario de atención</h2>
        <p className="mb-3 mt-0.5 text-xs text-[var(--color-faint)]">
          Tu agente solo ofrece turnos dentro de estas franjas. Puedes cargar varias por día
          (por ejemplo, mañana y tarde).
        </p>
        <Horarios horarios={(horarios ?? []) as Horario[]} />
      </section>
    </div>
  );
}
