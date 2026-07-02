import { Composition } from "remotion";
import { BrandClip, brandClip } from "./entry";

/** Compositions registradas — usadas por Remotion Studio y el render (SSR). */
export const RemotionRoot: React.FC = () => (
  <Composition
    id={brandClip.id}
    component={BrandClip}
    durationInFrames={brandClip.durationInFrames}
    fps={brandClip.fps}
    width={brandClip.width}
    height={brandClip.height}
  />
);
