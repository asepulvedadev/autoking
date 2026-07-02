"use client";

import { useState } from "react";
import { cn } from "@autoking/ui";

type Industry = {
  key: string;
  label: string;
  emoji: string;
  question: string;
  answer: string;
};

const INDUSTRIES: Industry[] = [
  {
    key: "spa",
    label: "Spa & Estética",
    emoji: "💆",
    question: "Hola, ¿tienen espacio para un masaje el sábado?",
    answer:
      "¡Hola! 💆 Con gusto. El sábado tengo disponible a las 11:00 y 4:30 p. m. El masaje relajante de 60 min cuesta $650. ¿Te reservo alguno?",
  },
  {
    key: "dental",
    label: "Consultorio dental",
    emoji: "🦷",
    question: "¿Cuánto cuesta una limpieza dental?",
    answer:
      "¡Hola! 🦷 La limpieza cuesta $80 e incluye revisión. Tengo cita mañana a las 10:00 o el jueves a las 5:00 p. m. ¿Cuál te sirve?",
  },
  {
    key: "barber",
    label: "Barbería",
    emoji: "💈",
    question: "¿Puedo pasar ahora sin cita?",
    answer:
      "¡Qué más! 💈 Ahora hay 20 min de espera. Si quieres te agendo a las 6:15 p. m. y entras directo. ¿Lo dejo a tu nombre?",
  },
  {
    key: "beauty",
    label: "Peluquería",
    emoji: "💇",
    question: "Quiero color y corte, ¿qué días tienes?",
    answer:
      "¡Hola! 💇 Para color + corte necesito unas 2 horas. Tengo miércoles 3:00 p. m. o viernes 11:00. El combo desde $120. ¿Te agendo?",
  },
  {
    key: "clinic",
    label: "Clínica estética",
    emoji: "✨",
    question: "¿Hacen limpieza facial? ¿Precio?",
    answer:
      "¡Hola! ✨ Sí, la limpieza facial profunda cuesta $90 (dura 50 min). Tengo espacio el martes 12:00 y el sábado 10:00. ¿Reservo?",
  },
];

export function Industries() {
  const [active, setActive] = useState(0);
  const current = INDUSTRIES[active]!;

  return (
    <section className="section" id="rubros">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Para tu negocio</span>
          <h2>
            Habla el idioma de <span className="text-blue">tu sector</span>
          </h2>
          <p>Elige tu tipo de negocio y mira cómo respondería tu agente. Se entrena con tus precios y servicios.</p>
        </div>

        <div className="reveal mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map((ind, i) => (
              <button
                key={ind.key}
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                  i === active
                    ? "border-blue-bright bg-blue/[0.12] text-white"
                    : "border-[var(--line)] text-[var(--color-muted)] hover:border-[var(--line-strong)] hover:text-white",
                )}
              >
                <span className="mr-1.5">{ind.emoji}</span>
                {ind.label}
              </button>
            ))}
          </div>

          <div key={current.key} className="card animate-[fadeIn_.4s_var(--ease)]">
            <div className="flex flex-col gap-3">
              <div className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-[linear-gradient(135deg,#1e6bff,#1450c7)] px-4 py-3 text-[15px] text-white">
                {current.question}
              </div>
              <div className="flex items-start gap-2.5 self-start">
                <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep text-xs font-bold text-white">
                  AK
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-[var(--line)] bg-[var(--color-surface-2)] px-4 py-3 text-[15px] text-[var(--color-ink)]">
                  {current.answer}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
