import { Marquee } from "@autoking/ui";

const TOOLS = [
  "WhatsApp",
  "Google Calendar",
  "Instagram",
  "Messenger",
  "Google Sheets",
  "Calendly",
  "Outlook",
];

function Chip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--color-surface)] px-5 py-2.5">
      <span className="h-2 w-2 flex-none rounded-full bg-blue-bright shadow-[0_0_8px_var(--color-blue-bright)]" />
      <span className="whitespace-nowrap text-sm font-medium text-[var(--color-muted)]">{label}</span>
    </div>
  );
}

export function Integrations() {
  return (
    <section className="section" id="integraciones">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Integraciones</span>
          <h2>
            Se conecta con lo que <span className="text-blue">ya usas</span>
          </h2>
          <p>Sin cambiar de herramientas. Tu agente trabaja sobre lo que ya tienes funcionando.</p>
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
          {TOOLS.map((t) => (
            <Chip key={t} label={t} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
