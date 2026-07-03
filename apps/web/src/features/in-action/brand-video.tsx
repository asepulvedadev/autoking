"use client";

import { Player } from "@remotion/player";
import { BrandClip, brandClip } from "@autoking/video";

// Aislado en su propio chunk: Remotion + la composición NO entran al bundle
// inicial. Se carga async (ssr:false) solo cuando InAction se monta, así el
// resto de la landing (FAQ, nav, etc.) se vuelve interactiva sin esperar el video.
export default function BrandVideo() {
  return (
    <Player
      component={BrandClip}
      durationInFrames={brandClip.durationInFrames}
      fps={brandClip.fps}
      compositionWidth={brandClip.width}
      compositionHeight={brandClip.height}
      autoPlay
      loop
      controls
      style={{ width: "100%" }}
    />
  );
}
