import { getTranslations } from "next-intl/server";
import {
  siWhatsapp,
  siGooglecalendar,
  siInstagram,
  siMessenger,
  siGooglesheets,
  siCalendly,
} from "simple-icons";

type SimpleIcon = { path: string; hex: string };

// Logos oficiales por marca (simple-icons). Outlook no está en simple-icons
// (Microsoft pidió removerlo) → ícono propio abajo.
const BRAND: Record<string, SimpleIcon> = {
  WhatsApp: siWhatsapp,
  "Google Calendar": siGooglecalendar,
  Instagram: siInstagram,
  Messenger: siMessenger,
  "Google Sheets": siGooglesheets,
  Calendly: siCalendly,
};

function OutlookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" role="img" aria-label="Outlook">
      {/* panel/sobre a la derecha */}
      <path d="M13 6.6h7.6c.77 0 1.4.63 1.4 1.4v8c0 .77-.63 1.4-1.4 1.4H13V6.6z" fill="#0F6CBD" />
      <path d="M13.6 8.4l4.2 2.8 4.2-2.8" fill="none" stroke="#fff" strokeWidth="1" opacity="0.85" strokeLinecap="round" />
      {/* la "O" azul a la izquierda */}
      <rect x="1.6" y="4" width="12" height="16" rx="3" fill="#0078D4" />
      <ellipse cx="7.6" cy="12" rx="2.7" ry="3.4" fill="none" stroke="#fff" strokeWidth="1.8" />
    </svg>
  );
}

function BrandIcon({ label }: { label: string }) {
  const icon = BRAND[label];
  if (icon) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" role="img" aria-label={label}>
        <path d={icon.path} fill={`#${icon.hex}`} />
      </svg>
    );
  }
  if (label === "Outlook") return <OutlookIcon />;
  return <span className="h-2 w-2 flex-none rounded-full bg-blue-bright" />;
}

function IntegrationCard({ label, featured = false, featuredText }: { label: string; featured?: boolean; featuredText: string }) {
  return (
    <div className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface/90 p-4 shadow-[0_12px_35px_rgba(8,25,50,0.08)] transition-transform duration-300 hover:-translate-y-1 ${featured ? "min-h-36 md:col-span-2 md:row-span-2 md:items-end" : "min-h-24"}`}>
      {featured && <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-blue-bright/15 blur-2xl" />}
      <span className={`relative flex items-center justify-center rounded-2xl border border-line bg-canvas ${featured ? "h-14 w-14" : "h-10 w-10"}`}>
        <BrandIcon label={label} />
      </span>
      <span className="relative min-w-0">
        <span className="block truncate text-sm font-semibold text-ink">{label}</span>
        {featured && <span className="mt-1 block max-w-48 text-xs leading-5 text-muted">{featuredText}</span>}
      </span>
      <span className="relative ml-auto h-2 w-2 rounded-full bg-blue-bright shadow-[0_0_0_4px_rgba(36,113,255,0.12)]" aria-hidden="true" />
    </div>
  );
}

export async function Integrations() {
  const t = await getTranslations("Integrations");
  const tools = t.raw("tools") as string[];
  return (
    <section className="border-t border-line bg-surface/35 py-20 sm:py-28" id="integraciones" aria-labelledby="integrations-title">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-bright">{t("eyebrow")}</p>
          <h2 id="integrations-title" className="text-balance text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
            {t("titleA")} <span className="text-blue-bright">{t("titleHighlight")}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-muted sm:text-lg">{t("subtitle")}</p>
        </div>

        <div className="relative mx-auto mt-14 grid max-w-5xl gap-4 overflow-hidden rounded-[2rem] border border-line bg-canvas p-5 shadow-[0_24px_80px_rgba(8,25,50,0.08)] sm:p-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative flex flex-col justify-between rounded-3xl border border-blue-bright/20 bg-blue-bright/[0.07] p-6 sm:p-8">
            <div>
              <span className="inline-flex rounded-full border border-blue-bright/25 bg-blue-bright/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-bright">{t("flowLabel")}</span>
              <h3 className="mt-6 max-w-xs text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">{t("panelTitle")}</h3>
              <p className="mt-4 max-w-sm text-sm leading-6 text-muted">{t("panelText")}</p>
            </div>
            <div className="mt-12 flex items-center gap-3 text-xs font-semibold text-ink"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {t("status")}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tools.map((tool, index) => <IntegrationCard key={tool} label={tool} featured={index === 0} featuredText={t("featuredText")} />)}
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-faint">{t("footnote")}</p>
      </div>
    </section>
  );
}
