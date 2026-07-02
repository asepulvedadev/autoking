import type { ReactNode } from "react";
import { BentoGrid, Spotlight, cn } from "@autoking/ui";

type Benefit = { icon: ReactNode; title: string; text: string };

const BENEFITS: Benefit[] = [
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    title: "Atención 24/7",
    text: "Tu negocio responde a toda hora, todos los días. Nunca más un cliente esperando ni un mensaje sin contestar.",
  },
  {
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />
      </>
    ),
    title: "Agenda automática",
    text: "Reserva citas directo en tu calendario, sin choques de horario.",
  },
  {
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </>
    ),
    title: "Menos inasistencias",
    text: "Recordatorios automáticos antes de cada cita.",
  },
  {
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    title: "Respuestas inmediatas",
    text: "Contesta en segundos, no en horas. El que responde primero es el que cierra la venta.",
  },
  {
    icon: <path d="M20 6L9 17l-5-5" />,
    title: "Imagen profesional",
    text: "Mensajes claros, ordenados y siempre amables. Tu negocio se ve de primer nivel.",
  },
  {
    icon: (
      <>
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </>
    ),
    title: "Recuperas ventas",
    text: "Esos mensajes que antes se perdían ahora se convierten en clientes.",
  },
];

// Tamaños bento (desktop): filas de 4+2, 2+4, 3+3 → layout asimétrico moderno.
const SPANS = [
  "lg:col-span-4",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-4",
  "lg:col-span-3",
  "lg:col-span-3",
];

export function Benefits() {
  return (
    <section className="section" id="beneficios">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Beneficios</span>
          <h2>
            Lo que <span className="text-blue">ganas</span> desde el primer día
          </h2>
          <p>Esto no es tecnología por moda. Es dinero que dejas de perder y clientes que dejas de regalar.</p>
        </div>

        <BentoGrid className="reveal">
          {BENEFITS.map((b, i) => (
            <Spotlight key={b.title} className={cn("h-full rounded-[var(--radius-card)]", SPANS[i])}>
              <div className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-bg-2)] p-7 transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[var(--line-strong)]">
                <div className="ico">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    {b.icon}
                  </svg>
                </div>
                <h3 className="mb-2 text-[19px] font-bold text-[var(--color-ink)]">{b.title}</h3>
                <p className="text-[15px] text-[var(--color-muted)]">{b.text}</p>
              </div>
            </Spotlight>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
