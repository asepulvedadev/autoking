"use client";

import { useState } from "react";
import { cn } from "@autoking/ui";
import styles from "./faq.module.css";

const FAQS = [
  {
    q: "¿En cuánto tiempo está listo mi agente?",
    a: "En la mayoría de los casos, entre 3 y 7 días hábiles. Conectamos tu WhatsApp, entrenamos al agente con la info de tu negocio y lo dejamos atendiendo. Rápido y sin complicaciones.",
  },
  {
    q: "¿Funciona con mi WhatsApp actual?",
    a: "Sí. Usamos tu mismo número con WhatsApp Business. Tus clientes te siguen escribiendo al número de siempre, la diferencia es que ahora siempre hay alguien —bueno, algo— respondiendo al instante.",
  },
  {
    q: "¿Necesito conocimientos técnicos?",
    a: "Para nada. De la parte técnica nos encargamos nosotros 100%. Vos solo nos contás cómo funciona tu negocio y nosotros armamos, conectamos y entrenamos todo.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Claro. No hay contratos eternos ni letra chica. Es un servicio mensual y podés cancelar cuando quieras. Confiamos en que te vas a quedar por los resultados, no por obligación.",
  },
  {
    q: "¿El agente puede pasarme una conversación a mí?",
    a: "Sí. Cuando una consulta necesita atención humana o el cliente lo pide, el agente te deriva la conversación al instante. Vos tenés siempre el control y podés tomar el chat cuando quieras.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Preguntas frecuentes</span>
          <h2>
            Lo que seguro te estás <span className="text-blue">preguntando</span>
          </h2>
        </div>

        <div className={styles.wrap}>
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div className={cn(styles.item, isOpen && styles.open, "reveal")} key={faq.q}>
                <button
                  className={styles.q}
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  {faq.q}
                  <span className={styles.plus} aria-hidden="true" />
                </button>
                <div className={styles.answer}>
                  <div>
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
