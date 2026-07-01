import type { ReactNode } from "react";
import { cn } from "@autoking/ui";

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
    text: "Tu negocio responde a toda hora, todos los días. Nunca más un cliente esperando.",
  },
  {
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" />
      </>
    ),
    title: "Agenda automática",
    text: "Reserva citas directo en tu calendario, sin choques de horario ni ida y vuelta.",
  },
  {
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </>
    ),
    title: "Menos inasistencias",
    text: "Recordatorios automáticos antes de cada cita. Menos huecos, menos plata perdida.",
  },
  {
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    title: "Respuestas inmediatas",
    text: "Contesta en segundos, no en horas. El que responde primero es el que cierra la venta.",
  },
  {
    icon: <path d="M20 6L9 17l-5-5" />,
    title: "Imagen profesional",
    text: "Mensajes claros, ordenados y siempre amables. Tu negocio se ve serio y de primer nivel.",
  },
  {
    icon: (
      <>
        <path d="M23 6l-9.5 9.5-5-5L1 18" />
        <path d="M17 6h6v6" />
      </>
    ),
    title: "Recuperás ventas",
    text: "Esos mensajes que antes se perdían ahora se convierten en clientes y citas reales.",
  },
];

export function Benefits() {
  return (
    <section className="section" id="beneficios">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Beneficios</span>
          <h2>
            Lo que <span className="text-blue">ganás</span> desde el primer día
          </h2>
          <p>
            Esto no es tecnología por moda. Es plata que dejás de perder y clientes que dejás de
            regalar.
          </p>
        </div>

        <div className="grid cols-3">
          {BENEFITS.map((b, i) => (
            <div className={cn("card reveal", `d${i % 3}`)} key={b.title}>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {b.icon}
                </svg>
              </div>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
