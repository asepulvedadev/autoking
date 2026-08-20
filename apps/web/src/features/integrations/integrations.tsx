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

function Chip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface px-5 py-2.5">
      <BrandIcon label={label} />
      <span className="whitespace-nowrap text-sm font-medium text-ink">{label}</span>
    </div>
  );
}

function Connector({ label, category }: { label: string; category: string }) {
  return (
    <div className="group relative flex items-center gap-3 rounded-2xl border border-line bg-surface/90 p-3 shadow-[0_12px_35px_rgba(8,25,50,0.08)] transition-transform duration-300 hover:-translate-y-1">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas">
        <BrandIcon label={label} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{category}</span>
        <span className="block truncate text-sm font-semibold text-ink">{label}</span>
      </span>
      <span className="ml-auto h-2 w-2 rounded-full bg-blue-bright shadow-[0_0_0_4px_rgba(36,113,255,0.12)]" aria-hidden="true" />
    </div>
  );
}

export async function Integrations() {
  const t = await getTranslations("Integrations");
  const tools = t.raw("tools") as string[];
  const primaryTools = tools.slice(0, 4);
  const secondaryTools = tools.slice(4);

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

        <div className="relative mx-auto mt-14 max-w-5xl overflow-hidden rounded-[2rem] border border-line bg-canvas p-5 shadow-[0_24px_80px_rgba(8,25,50,0.08)] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(36,113,255,0.12),transparent_34%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_220px_1fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {primaryTools.slice(0, 2).map((tool) => <Connector key={tool} label={tool} category={t("channelLabel")} />)}
            </div>

            <div className="relative mx-auto flex h-48 w-48 flex-col items-center justify-center rounded-[2rem] border border-blue-bright/30 bg-ink text-center shadow-[0_0_0_10px_rgba(36,113,255,0.06),0_20px_60px_rgba(36,113,255,0.24)]">
              <span className="absolute -top-3 rounded-full border border-blue-bright/30 bg-canvas px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-bright">{t("hubLabel")}</span>
              <span className="text-2xl font-bold tracking-[-0.05em] text-white">AutoKing</span>
              <span className="mt-2 max-w-[130px] text-xs leading-5 text-white/65">{t("hubText")}</span>
              <span className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> 24/7</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {primaryTools.slice(2).map((tool) => <Connector key={tool} label={tool} category={t("operationsLabel")} />)}
            </div>
          </div>

          <div className="relative mt-10 flex flex-col items-center gap-3 border-t border-line pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-faint">{t("flowLabel")}</p>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
              {secondaryTools.map((tool) => <Chip key={tool} label={tool} />)}
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-faint">{t("footnote")}</p>
      </div>
    </section>
  );
}
