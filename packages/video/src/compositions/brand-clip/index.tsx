import {
  AbsoluteFill,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useEffect, useState } from "react";

const COLORS = {
  bg: "#05070d",
  panel: "#0c111b",
  panelRaised: "#111a28",
  ink: "#f4f7ff",
  muted: "#8f9bb2",
  blue: "#1e6bff",
  blueBright: "#67a0ff",
  coral: "#ff7078",
  green: "#49d58c",
  line: "rgba(156, 184, 232, 0.16)",
};

const FONT_FAMILY = "AutoKing Sans, DejaVu Sans, sans-serif";
const FONT_FILE = staticFile("AutoKingSans.ttf");
const LOGO_FILE = staticFile("AutoKing-logo.png");
const SCENE_DURATION = 58;
const SCENE_STEP = 46;
const OUTRO_FROM = 230;
const OUTRO_DURATION = 100;
const FADE_IN = 8;
const FADE_OUT = 10;
const DEFAULT_SUBTITLE = "Turn every WhatsApp conversation into the next right step.";
const DEFAULT_TAGLINE = "Your revenue loop, always moving.";
const DEFAULT_CTA = "Book a demo";

export type BrandClipCopy = {
  messageLost: string;
  instantReply: string;
  qualified: string;
  confirmed: string;
  followUp: string;
  subtitle?: string;
  brandTagline?: string;
  cta?: string;
};

const DEFAULT_COPY: BrandClipCopy = {
  messageLost: "Missed message",
  instantReply: "Instant reply",
  qualified: "Qualified client",
  confirmed: "Booking confirmed",
  followUp: "Follow-up",
  subtitle: DEFAULT_SUBTITLE,
  brandTagline: DEFAULT_TAGLINE,
  cta: DEFAULT_CTA,
};

/** Load a checked-in font once so Studio, Player and renderer use the same glyphs. */
const DeterministicFont: React.FC = () => {
  const [handle] = useState(() => delayRender("brand-clip-font"));

  useEffect(() => {
    const finish = () => continueRender(handle);
    if (typeof document === "undefined" || !document.fonts) {
      finish();
      return;
    }

    document.fonts.load(`700 32px "AutoKing Sans"`).then(finish).catch(finish);
  }, [handle]);

  return (
    <style>{`
      @font-face {
        font-family: "AutoKing Sans";
        src: url("${FONT_FILE}") format("truetype");
        font-weight: 400 800;
        font-style: normal;
        font-display: block;
      }
    `}</style>
  );
};

const ease = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const SceneFrame: React.FC<{
  index: number;
  label: string;
  detail: string;
  accent: string;
  copy: string;
}> = ({ index, label, detail, accent, copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 110, mass: 0.8 } });
  const opacity = interpolate(frame, [0, FADE_IN, SCENE_DURATION - FADE_OUT, SCENE_DURATION], [0, 1, 1, 0], ease);
  const y = interpolate(rise, [0, 1], [28, 0]);
  const lineProgress = interpolate(frame, [12, 38], [0, 1], ease);

  return (
    <AbsoluteFill style={{ opacity, padding: "70px 110px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: COLORS.muted, fontSize: 20, letterSpacing: 3, textTransform: "uppercase" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Img src={LOGO_FILE} style={{ width: 118, height: "auto" }} />
          <span style={{ opacity: 0.7 }}>Revenue loop</span>
        </div>
        <span style={{ color: accent, fontWeight: 700 }}>0{index + 1} / 05</span>
      </div>

      <div style={{ position: "relative", display: "grid", gridTemplateColumns: "0.72fr 1.28fr", gap: 64, alignItems: "center", height: "100%", transform: `translateY(${y}px)` }}>
        <div>
          <div style={{ width: 58, height: 4, marginBottom: 28, borderRadius: 99, background: accent, transform: `scaleX(${lineProgress})`, transformOrigin: "left" }} />
          <div style={{ color: accent, fontSize: 22, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</div>
          <div style={{ maxWidth: 540, marginTop: 18, color: COLORS.ink, fontSize: 52, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.8 }}>{copy}</div>
          <div style={{ maxWidth: 440, marginTop: 22, color: COLORS.muted, fontSize: 23, lineHeight: 1.45 }}>{detail}</div>
        </div>

        <StageVisual index={index} accent={accent} />
      </div>

      <div style={{ position: "absolute", right: 110, bottom: 38, left: 110, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1, height: 1, background: COLORS.line }} />
        <div style={{ width: 112, height: 3, overflow: "hidden", borderRadius: 99, background: COLORS.line }}>
          <div style={{ width: `${Math.min(100, (frame / SCENE_DURATION) * 100)}%`, height: "100%", background: accent }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StageVisual: React.FC<{ index: number; accent: string }> = ({ index, accent }) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 8), [-1, 1], [0.88, 1]);
  const items = ["WhatsApp", "Reply", "Intent", "Calendar", "Next step"];

  return (
    <div style={{ position: "relative", minHeight: 310, padding: 30, border: `1px solid ${COLORS.line}`, borderRadius: 28, background: `linear-gradient(145deg, ${COLORS.panelRaised}, ${COLORS.panel})`, boxShadow: `0 32px 90px rgba(0,0,0,0.34), 0 0 70px ${accent}1f` }}>
      <div style={{ position: "absolute", top: 25, right: 28, color: COLORS.muted, fontSize: 17, letterSpacing: 1 }}>AUTOKING / LIVE</div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", gap: 14 }}>
        {items.slice(0, index + 1).map((item, itemIndex) => {
          const itemFrame = frame - itemIndex * 7;
          const itemOpacity = interpolate(itemFrame, [0, 8], [0, 1], ease);
          const itemY = interpolate(itemFrame, [0, 12], [16, 0], ease);
          return (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 15, opacity: itemOpacity, transform: `translateY(${itemY}px)`, padding: "15px 18px", border: `1px solid ${itemIndex === index ? `${accent}75` : COLORS.line}`, borderRadius: 15, background: itemIndex === index ? `${accent}18` : "rgba(255,255,255,0.025)" }}>
              <div style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "50%", background: itemIndex === index ? accent : COLORS.line, color: itemIndex === index ? COLORS.bg : COLORS.muted, fontSize: 15, fontWeight: 800, transform: `scale(${itemIndex === index ? pulse : 1})` }}>{itemIndex === index ? "✓" : itemIndex + 1}</div>
              <div style={{ color: itemIndex === index ? COLORS.ink : COLORS.muted, fontSize: 23, fontWeight: itemIndex === index ? 700 : 500 }}>{item}</div>
              {itemIndex === index && <div style={{ marginLeft: "auto", color: accent, fontSize: 16, letterSpacing: 1.2 }}>ACTIVE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Outro: React.FC<{ copy: BrandClipCopy }> = ({ copy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 16, OUTRO_DURATION - 12, OUTRO_DURATION], [0, 1, 1, 0], ease);
  const scale = interpolate(spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 90 } }), [0, 1], [0.94, 1]);
  return (
    <AbsoluteFill style={{ opacity, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <Img src={LOGO_FILE} style={{ width: 270, height: "auto", transform: `scale(${scale})` }} />
      <div style={{ maxWidth: 760, marginTop: 32, color: COLORS.ink, fontSize: 44, fontWeight: 800, lineHeight: 1.1 }}>{copy.brandTagline}</div>
      <div style={{ marginTop: 36, padding: "18px 34px", border: `1px solid ${COLORS.blueBright}`, borderRadius: 999, background: COLORS.blue, color: "white", fontSize: 24, fontWeight: 800, boxShadow: "0 20px 60px rgba(30,107,255,0.32)" }}>{copy.cta}</div>
    </AbsoluteFill>
  );
};

export const BrandClip: React.FC<Partial<BrandClipCopy>> = (input) => {
  const copy: BrandClipCopy = {
    messageLost: input.messageLost ?? DEFAULT_COPY.messageLost,
    instantReply: input.instantReply ?? DEFAULT_COPY.instantReply,
    qualified: input.qualified ?? DEFAULT_COPY.qualified,
    confirmed: input.confirmed ?? DEFAULT_COPY.confirmed,
    followUp: input.followUp ?? DEFAULT_COPY.followUp,
    subtitle: input.subtitle ?? DEFAULT_SUBTITLE,
    brandTagline: input.brandTagline ?? DEFAULT_TAGLINE,
    cta: input.cta ?? DEFAULT_CTA,
  };
  const labels = [copy.messageLost, copy.instantReply, copy.qualified, copy.confirmed, copy.followUp];
  const accents = [COLORS.coral, COLORS.blueBright, COLORS.blueBright, COLORS.green, COLORS.blueBright];
  const details = [
    copy.subtitle ?? DEFAULT_SUBTITLE,
    copy.subtitle ?? DEFAULT_SUBTITLE,
    copy.subtitle ?? DEFAULT_SUBTITLE,
    copy.subtitle ?? DEFAULT_SUBTITLE,
    copy.subtitle ?? DEFAULT_SUBTITLE,
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: FONT_FAMILY }}>
      <DeterministicFont />
      <Background />
      {labels.map((label, index) => (
        <Sequence key={label} from={index * SCENE_STEP} durationInFrames={SCENE_DURATION}>
          <SceneFrame index={index} label={label} detail={details[index] ?? copy.subtitle ?? DEFAULT_SUBTITLE} accent={accents[index] ?? COLORS.blueBright} copy={label} />
        </Sequence>
      ))}
      <Sequence from={OUTRO_FROM} durationInFrames={OUTRO_DURATION}>
        <Outro copy={copy} />
      </Sequence>
    </AbsoluteFill>
  );
};

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(Math.sin(frame / 45), [-1, 1], [-2, 2]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: 0.95 }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${COLORS.line} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.line} 1px, transparent 1px)`, backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 80% 75% at 50% 40%, black 20%, transparent 90%)", transform: `translate(${drift}px, ${drift}px)` }} />
      <div style={{ position: "absolute", top: -260, left: "34%", width: 820, height: 820, borderRadius: "50%", background: "rgba(30,107,255,0.16)", filter: "blur(140px)" }} />
      <div style={{ position: "absolute", right: -260, bottom: -320, width: 760, height: 760, borderRadius: "50%", background: "rgba(73,213,140,0.06)", filter: "blur(160px)" }} />
    </AbsoluteFill>
  );
};
