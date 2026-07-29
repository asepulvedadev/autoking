import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingForm, type OnboardingCliente, type Chunk } from "./onboarding-form";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // la lectura de imágenes con visión puede tardar

export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data } = await admin
    .from("clientes")
    .select("id, business_name, asistente, emoji, servicios, horario, ubicacion, tono, notas_negocio")
    .eq("onboarding_token", token)
    .single();

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg)] p-6 text-center">
        <div>
          <div className="text-4xl">🔒</div>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-white">Link inválido o vencido</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Pedile a tu asesor de AutoKing un link nuevo.</p>
        </div>
      </main>
    );
  }

  const { data: chunksData } = await admin
    .from("knowledge_base")
    .select("id, titulo, contenido")
    .eq("cliente_id", data.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 text-sm text-[var(--color-gold)]">
          <span className="text-lg">👑</span> AutoKing
        </div>
        <h1 className="mt-3 font-display text-[clamp(24px,5vw,34px)] font-extrabold leading-tight text-white">
          Configurá tu asistente de {data.business_name}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Contanos de tu negocio para entrenar a tu agente de WhatsApp. Podés volver a este link y editarlo cuando quieras.
        </p>

        <OnboardingForm
          token={token}
          cliente={data as OnboardingCliente}
          chunks={(chunksData ?? []) as Chunk[]}
        />
      </div>
    </main>
  );
}
