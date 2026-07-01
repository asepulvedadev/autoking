import type { ReactNode } from "react";
import { cn } from "@autoking/ui";

type Pain = { icon: ReactNode; title: string; text: string };

const PAINS: Pain[] = [
  {
    icon: (
      <path d="M12 2a7 7 0 00-7 7c0 5-2 6-2 6h18s-2-1-2-6a7 7 0 00-7-7zM9 20a3 3 0 006 0" />
    ),
    title: "Mensajes a medianoche sin responder",
    text: "Tus clientes escriben a las 11 de la noche o un domingo. Para cuando ves el mensaje, ya buscaron a otro.",
  },
  {
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
      </>
    ),
    title: "Citas que nunca se agendan",
    text: "El cliente quería reservar, pero entre idas y vueltas de mensajes se enfrió y nunca cerró la cita.",
  },
  {
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    ),
    title: "Clientes que se van con la competencia",
    text: "El que responde primero, gana. Si tardás horas, el cliente ya está agendado en otro lado.",
  },
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    title: "Horas perdidas en preguntas repetidas",
    text: '"¿Cuánto cuesta?", "¿Dónde están?", "¿Tienen lugar?". Las mismas preguntas, mil veces, robándote tiempo.',
  },
];

export function Problem() {
  return (
    <section className="section" id="problema">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">El problema</span>
          <h2>
            Cada mensaje sin responder es <span className="text-blue">una venta que se va</span>
          </h2>
          <p>
            Mientras vos atendés, dormís o descansás, tus clientes escriben. Y si nadie responde, se
            van con el de al lado. Así de simple.
          </p>
        </div>

        <div className="grid cols-2">
          {PAINS.map((pain, i) => (
            <div className={cn("card pain reveal", i > 0 && `d${i}`)} key={pain.title}>
              <div className="ico">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {pain.icon}
                </svg>
              </div>
              <h3>{pain.title}</h3>
              <p>{pain.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
