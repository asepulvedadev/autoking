import { buttonVariants, WhatsAppIcon, AuroraBackground, cn } from "@autoking/ui";
import { waHref } from "@/lib/site";
import { WhatsAppMock } from "./whatsapp-mock";
import styles from "./hero.module.css";

const PROOF = [
  { num: "24/7", lbl: "Siempre disponible" },
  { num: "<5 seg", lbl: "Tiempo de respuesta" },
  { num: "+40%", lbl: "Más citas agendadas" },
];

export function Hero() {
  return (
    <section className={styles.hero} id="hero">
      <div className="grid-bg" />
      <AuroraBackground />

      <div className={cn("container", styles.grid)}>
        <div>
          <span className={cn(styles.badge, "reveal")}>
            <span className={styles.badgeDot} /> Un agente que nunca duerme · responde en segundos
          </span>
          <h1 className={cn(styles.title, "reveal", "d1", "glow-text")}>
            Deja de perder clientes <br />y citas por <span>no responder a tiempo</span>
          </h1>
          <p className={cn(styles.sub, "reveal", "d2")}>
            AutoKing te pone un agente de inteligencia artificial que atiende, responde y agenda{" "}
            <b>solo, 24/7</b> en tu WhatsApp. Como un empleado que nunca duerme, nunca se enferma y
            nunca pierde una venta.
          </p>

          <div className={cn(styles.cta, "reveal", "d3")}>
            <a href={waHref()} target="_blank" rel="noopener" className={buttonVariants({ variant: "primary", size: "lg" })}>
              <WhatsAppIcon /> Agenda una demo
            </a>
            <a href="#solucion" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Conoce más
            </a>
          </div>

          <div className={cn(styles.proof, "reveal", "d4")}>
            {PROOF.map((p) => (
              <div className={styles.proofItem} key={p.lbl}>
                <span className={styles.proofNum}>{p.num}</span>
                <span className={styles.proofLbl}>{p.lbl}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={cn(styles.phoneWrap, "reveal", "d2")}>
          <div className={cn("glow-orb", styles.phoneOrb)} />
          <WhatsAppMock />
        </div>
      </div>
    </section>
  );
}
