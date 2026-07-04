import { getTranslations } from "next-intl/server";
import { Marquee } from "@autoking/ui";
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
    <div className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--color-surface)] px-5 py-2.5">
      <BrandIcon label={label} />
      <span className="whitespace-nowrap text-sm font-medium text-white/90">{label}</span>
    </div>
  );
}

export async function Integrations() {
  const t = await getTranslations("Integrations");
  const tools = t.raw("tools") as string[];

  return (
    <section className="section" id="integraciones">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h2>
            {t("titleA")} <span className="text-blue">{t("titleHighlight")}</span>
          </h2>
          <p>{t("subtitle")}</p>
        </div>
      </div>

      <div
        className="reveal relative"
        style={{
          maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        <Marquee speed={34}>
          {tools.map((tool) => (
            <Chip key={tool} label={tool} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
