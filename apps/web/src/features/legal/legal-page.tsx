import { Header } from "@/shared/header/header";
import { Footer } from "@/features/footer/footer";

/* ⚠️⚠️ BORRADOR LEGAL — NO PRODUCCIÓN ⚠️⚠️
   El contenido de /privacidad y /terminos es una PLANTILLA orientativa.
   DEBE ser revisado y aprobado por un abogado antes de publicar, y hay que
   completar los placeholders [RAZÓN SOCIAL], [NIT], [CIUDAD/DIRECCIÓN]. */

export type LegalSection = { heading: string; body: string[] };

/** Shell de página legal: mismo Header/Footer y estilo del sitio, contenido
 *  en formato de artículo legible. */
export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Header />
      <main className="section pt-28">
        <div className="container max-w-3xl">
          <h1 className="font-display text-[clamp(28px,5vw,40px)] font-extrabold leading-tight text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-faint)]">{updated}</p>

          <div className="mt-10 flex flex-col gap-9">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2 className="font-display text-lg font-bold text-white">{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
