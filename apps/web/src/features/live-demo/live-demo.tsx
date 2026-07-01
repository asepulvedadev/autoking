"use client";

import { useEffect, useRef, useState } from "react";
import { buttonVariants, WhatsAppIcon, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";

type Msg = { from: "agent" | "user"; text: string };

const GREETING =
  "¡Hola! 👋 Soy el asistente de AutoKing. Preguntame lo que quieras: precios, horarios o pedime un turno.";

const RULES: { match: string[]; reply: string }[] = [
  {
    match: ["precio", "cuesta", "cuánto", "cuanto", "vale", "sale", "costo"],
    reply:
      "Depende del servicio 😊 Por ejemplo, una consulta arranca en $500. ¿Querés la lista completa o te agendo directamente?",
  },
  {
    match: ["horario", "abren", "abierto", "hora", "atienden"],
    reply: "Atendemos de lunes a sábado de 9 a 20 hs. Pero yo te respondo 24/7 👌 ¿Te busco un turno?",
  },
  {
    match: ["ubicaci", "donde", "dónde", "direcci", "llegar", "quedan"],
    reply: "Estamos en el centro, a una cuadra de la plaza 📍 ¿Te espero con un turno reservado?",
  },
  {
    match: ["turno", "cita", "agendar", "reservar", "mañana", "manana", "hoy", "sábado", "sabado", "disponible"],
    reply:
      "¡Genial! Tengo lugar mañana a las 10:00, 13:30 y 17:00 ✅ ¿Cuál te queda mejor? Lo dejo agendado al toque.",
  },
  {
    match: ["hola", "buenas", "buenos", "qué tal", "que tal"],
    reply: "¡Hola! 👋 ¿En qué te ayudo? Puedo darte precios, horarios o agendarte un turno.",
  },
  {
    match: ["gracias", "genial", "perfecto", "dale", "listo", "buenísimo"],
    reply: "¡De nada! 🙌 Y ojo: con AutoKing esto lo hace tu negocio solo, las 24 horas.",
  },
];

const FALLBACK =
  "Buena pregunta 🤔 En la versión real, tu agente respondería esto entrenado con la info de TU negocio. ¿Querés ver precios, horarios o agendar un turno?";

const QUICK = ["¿Cuánto cuesta?", "¿Tienen turno mañana?", "¿Dónde están?", "¿Qué horario tienen?"];

function replyFor(text: string): string {
  const t = text.toLowerCase();
  for (const r of RULES) if (r.match.some((m) => t.includes(m))) return r.reply;
  return FALLBACK;
}

export function LiveDemo() {
  const [messages, setMessages] = useState<Msg[]>([{ from: "agent", text: GREETING }]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: clean }]);
    setTyping(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, { from: "agent", text: replyFor(clean) }]);
      setTyping(false);
    }, 900);
  };

  return (
    <section className="section" id="demo-vivo">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Probalo vos mismo</span>
          <h2>
            Escribile al agente <span className="text-blue">acá mismo</span>
          </h2>
          <p>Hacele una pregunta como si fueras un cliente. Así de rápido responde en tu WhatsApp.</p>
        </div>

        <div className="reveal mx-auto max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-[var(--line-strong)] bg-[var(--color-surface)] shadow-[var(--shadow-blue)]">
          {/* header */}
          <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[linear-gradient(120deg,#11283a,#0e2233)] px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue-deep text-sm font-bold text-white">
              AK
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AutoKing · Asistente</div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" /> en línea
              </div>
            </div>
          </div>

          {/* body */}
          <div ref={bodyRef} className="flex h-[340px] flex-col gap-2.5 overflow-y-auto bg-[rgb(7_12_16_/_0.6)] p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug animate-[fadeIn_.3s_var(--ease)]",
                  m.from === "user"
                    ? "self-end rounded-br-md bg-[linear-gradient(135deg,#1e6bff,#1450c7)] text-white"
                    : "self-start rounded-bl-md bg-[#1b2630] text-[#e7eefb]",
                )}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-[#1b2630] px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]"
                    style={{ animation: `float 1s ${d * 0.15}s infinite` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* quick replies */}
          <div className="flex flex-wrap gap-2 border-t border-[var(--line)] px-3 pt-3">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-blue-bright hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>

          {/* input */}
          <form
            className="flex items-center gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí tu mensaje…"
              className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--color-bg-2)] px-4 py-2.5 text-sm text-white outline-none placeholder:text-[var(--color-faint)] focus:border-blue-bright"
            />
            <button
              type="submit"
              aria-label="Enviar"
              className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-blue-bright to-blue text-white transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>

        <div className="reveal mt-6 text-center">
          <p className="mb-4 text-xs text-[var(--color-faint)]">
            * Demo con respuestas de ejemplo. Tu agente real se entrena con la info de tu negocio.
          </p>
          <a href={waHref()} target="_blank" rel="noopener" className={buttonVariants({ variant: "primary", size: "lg" })}>
            <WhatsAppIcon /> Quiero mi agente de verdad
          </a>
        </div>
      </div>
    </section>
  );
}
