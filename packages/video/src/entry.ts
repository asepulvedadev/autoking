// Entry "Player-safe": solo componentes + metadata. NO importa registerRoot
// ni @remotion/cli, para que apps/web pueda consumirlo sin arrastrar el renderer.
export { BrandClip } from "./compositions/brand-clip";

export const brandClip = {
  id: "BrandClip",
  fps: 30,
  durationInFrames: 330,
  width: 1600,
  height: 900,
} as const;
