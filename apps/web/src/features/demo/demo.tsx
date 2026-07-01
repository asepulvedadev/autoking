import { buttonVariants, WhatsAppIcon, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";
import styles from "./demo.module.css";

export function Demo() {
  return (
    <section className={cn("section", styles.section)} id="demo">
      <div className={cn("glow-orb", styles.orb)} />
      <div className="container">
        <div className={cn(styles.box, "reveal")}>
          <span className="eyebrow">Probalo vos mismo</span>
          <h2 className="glow-text">
            Hablá con el agente <span className="text-blue">en vivo</span> ahora mismo
          </h2>
          <p>
            No te lo contamos: probalo. Escribile al agente por WhatsApp como si fueras un cliente y
            mirá cómo responde y agenda en segundos.
          </p>
          <a
            href={waHref("Hola AutoKing 👑 Quiero probar el agente de IA en vivo.")}
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            <WhatsAppIcon /> Prueba el agente ahora
          </a>
        </div>
      </div>
    </section>
  );
}
