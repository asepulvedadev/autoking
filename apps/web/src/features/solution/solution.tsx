import { cn } from "@autoking/ui";
import styles from "./solution.module.css";

const STEPS = [
  {
    n: "01",
    title: "Conectamos tu WhatsApp",
    text: "Usamos tu mismo número de WhatsApp Business. En minutos tu agente queda enlazado y listo para atender.",
  },
  {
    n: "02",
    title: "Entrenamos al agente con tu negocio",
    text: "Le cargamos tus precios, servicios, horarios y forma de hablar. Responde como vos lo harías, con tu estilo.",
  },
  {
    n: "03",
    title: "Atiende y agenda solo, 24/7",
    text: "Desde ese momento responde, resuelve dudas y agenda citas sin que vos muevas un dedo. Día y noche.",
  },
];

export function Solution() {
  return (
    <section className={cn("section", styles.section)} id="solucion">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">La solución</span>
          <h2>
            Tu agente de IA, listo en <span className="text-blue">3 pasos simples</span>
          </h2>
          <p>Sin instalar nada raro, sin contratar gente, sin complicarte. Nosotros lo armamos por vos.</p>
        </div>

        <div className="grid cols-3">
          {STEPS.map((step, i) => (
            <div className={cn("card reveal", i > 0 && `d${i}`, styles.step)} key={step.n}>
              <span className={styles.ghost} aria-hidden="true">
                {i + 1}
              </span>
              <div className={styles.num}>{step.n}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
