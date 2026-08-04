import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Logo, buttonVariants, cn } from "@autoking/ui";
import { SITE_URL, waHref } from "@/lib/site";
import styles from "./page.module.css";

const higiaWaMessage =
  "Hola AutoKing. Quiero iniciar un piloto con Higia para mejorar un sistema de salud.";

const metrics = [
  { value: "-30%", label: "no-show objetivo", note: "recordatorios + reprogramación simple" },
  { value: "24/7", label: "orientación administrativa", note: "sin diagnóstico ni prescripción" },
  { value: "4", label: "semanas de piloto", note: "medición, guardrails y decisión" },
];

const useCases = [
  "Reducir no-show y reprogramaciones tardías.",
  "Detectar cuellos de botella en agenda, autorizaciones y admisión.",
  "Mejorar seguimiento administrativo post-consulta.",
  "Clasificar reclamos por causa raíz y riesgo operativo.",
  "Crear reportes ejecutivos con métricas y próximos pasos.",
];

const steps = [
  {
    kicker: "01",
    title: "Mapeamos el flujo",
    text: "Sede, servicio, canal, tiempos de espera, puntos de abandono y responsables del proceso.",
  },
  {
    kicker: "02",
    title: "Activamos un piloto seguro",
    text: "Higia trabaja con datos agregados, protocolos aprobados y escalamiento humano para riesgo clínico o legal.",
  },
  {
    kicker: "03",
    title: "Medimos impacto real",
    text: "No-show, primera respuesta, tiempo hasta cita, reclamos, continuidad y satisfacción del paciente.",
  },
];

const safeguards = [
  "No diagnostica pacientes.",
  "No prescribe medicamentos ni tratamientos.",
  "No revela historias clínicas identificables.",
  "No cambia protocolos clínicos sin revisión humana.",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = locale === "es" ? "/higia" : `/${locale}/higia`;

  return {
    metadataBase: new URL(SITE_URL),
    title: "Higia — Mejora de sistemas de salud",
    description:
      "Inicia un piloto con Higia para reducir fricción operativa, no-show y tiempos de respuesta en clínicas, hospitales y redes de atención.",
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages: { es: "/higia", en: "/en/higia" },
    },
    openGraph: {
      title: "Higia — Mejora de sistemas de salud",
      description:
        "Agente de mejora sistémica para salud: acceso, agenda, continuidad, experiencia del paciente y seguridad operacional.",
      url: `${SITE_URL}${path}`,
      siteName: "AutoKing",
      type: "website",
      locale: locale === "es" ? "es_CO" : "en_US",
    },
  };
}

export default async function HigiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const waUrl = waHref(higiaWaMessage);

  return (
    <main className={styles.page}>
      <div className={styles.gridBg} aria-hidden="true" />
      <div className={styles.orbOne} aria-hidden="true" />
      <div className={styles.orbTwo} aria-hidden="true" />

      <header className={styles.nav}>
        <a href={locale === "es" ? "/" : `/${locale}`} aria-label="Volver a AutoKing">
          <Logo />
        </a>
        <nav className={styles.navLinks} aria-label="Navegación de Higia">
          <a href="#piloto">Piloto</a>
          <a href="#seguridad">Seguridad</a>
          <a href="#inicio">Inicio</a>
        </nav>
        <a className={cn(buttonVariants({ variant: "primary" }), styles.navCta)} href={waUrl} target="_blank" rel="noopener">
          Iniciar piloto
        </a>
      </header>

      <section className={cn("container", styles.hero)}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Higia Health System</p>
          <h1>
            Mejora el sistema de salud <span>sin convertir el agente en médico.</span>
          </h1>
          <p className={styles.lead}>
            Higia analiza fricción operativa en clínicas, hospitales y redes de atención para reducir no-show,
            tiempos de espera y abandono del proceso con pilotos medibles y seguros.
          </p>
          <div className={styles.actions}>
            <a className={buttonVariants({ variant: "primary" })} href={waUrl} target="_blank" rel="noopener">
              Quiero iniciar con Higia
            </a>
            <a className={cn(buttonVariants({ variant: "secondary" }), styles.secondary)} href="#piloto">
              Ver cómo funciona
            </a>
          </div>
        </div>

        <aside className={styles.commandCard} aria-label="Panel de Higia">
          <div className={styles.cardTopline}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.agentHeader}>
            <div>
              <strong>Higia</strong>
              <small>Copiloto de mejora operacional</small>
            </div>
            <em>Seguro</em>
          </div>
          <div className={styles.insight}>
            <small>Hallazgo</small>
            <p>El 38% de las citas perdidas ocurre después del primer recordatorio y antes de la confirmación final.</p>
          </div>
          <div className={styles.recommendation}>
            <small>Acción recomendada</small>
            <p>Piloto de confirmación segmentada + reprogramación asistida 24 h antes de la cita.</p>
          </div>
          <div className={styles.guardrail}>
            <span>Guardrail clínico</span>
            <strong>No toca diagnóstico, triage ni tratamiento.</strong>
          </div>
        </aside>
      </section>

      <section className={cn("container", styles.metrics)} aria-label="Métricas del piloto">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <p>{metric.note}</p>
          </article>
        ))}
      </section>

      <section id="piloto" className={cn("container", styles.section)}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>Pilotos posibles</p>
          <h2>Empezar no requiere rehacer todo el hospital.</h2>
          <p>
            Higia entra por un proceso concreto, mide antes/después y deja una decisión clara: escalar,
            ajustar o apagar el piloto.
          </p>
        </div>
        <div className={styles.useCaseGrid}>
          {useCases.map((item) => (
            <article key={item} className={styles.useCase}>
              <span>✓</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={cn("container", styles.steps)}>
        {steps.map((step) => (
          <article key={step.kicker}>
            <span>{step.kicker}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <section id="seguridad" className={cn("container", styles.safety)}>
        <div>
          <p className={styles.eyebrow}>Límites no negociables</p>
          <h2>Diseñado para salud: privacidad, escalamiento y control humano.</h2>
          <p>
            Higia mejora el sistema, no reemplaza al equipo clínico. Cada recomendación separa hallazgo,
            evidencia, hipótesis, acción, métrica y riesgos.
          </p>
        </div>
        <ul>
          {safeguards.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="inicio" className={cn("container", styles.finalCta)}>
        <p className={styles.eyebrow}>Inicio</p>
        <h2>Inicia Higia con un piloto de 4 semanas.</h2>
        <p>
          Envíanos el proceso que quieres mejorar: agenda, admisión, autorizaciones, seguimiento o reclamos.
          Te devolvemos alcance, métricas y primer flujo operativo.
        </p>
        <a className={buttonVariants({ variant: "primary", size: "lg" })} href={waUrl} target="_blank" rel="noopener">
          Hablar por WhatsApp
        </a>
      </section>
    </main>
  );
}
