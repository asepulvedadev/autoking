"use client";

import dynamic from "next/dynamic";
import { Component, useState, type ErrorInfo, type ReactNode } from "react";
import { brandClip } from "@autoking/video";
import styles from "./brand-preview.module.css";

const LazyPlayer = dynamic(() => import("@remotion/player").then((module) => module.Player), {
  ssr: false,
  loading: () => <div className={styles.playerLoading} role="status" aria-live="polite" />,
});

const LazyBrandClip = dynamic(() => import("@autoking/video").then((module) => module.BrandClip), {
  ssr: false,
});

type Props = {
  stages: string[];
  buttonLabel: string;
  replayLabel: string;
  fallbackText: string;
};

class PlayerErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The static preview remains the recovery path when a lazy chunk fails.
  }

  override render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

type StaticPreviewProps = Pick<Props, "stages" | "buttonLabel" | "fallbackText"> & { onStart?: () => void; started?: boolean };

function StaticPreview({ stages, buttonLabel, fallbackText, onStart, started }: StaticPreviewProps) {
  return (
    <div className={styles.staticPreview}>
      <ol className={styles.preview} aria-label={fallbackText}>
        {stages.map((stage, index) => (
          <li className={styles.previewRow} key={stage}>
            <span className={styles.previewIndex} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span>{stage}</span>
          </li>
        ))}
      </ol>
      <p className={styles.fallbackText}>{fallbackText}</p>
      {onStart && (
        <button className={styles.playButton} type="button" onClick={onStart} disabled={started} aria-busy={started}>
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

export function BrandPlayer({ stages, buttonLabel, replayLabel, fallbackText }: Props) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <StaticPreview stages={stages} buttonLabel={buttonLabel} fallbackText={fallbackText} onStart={() => setStarted(true)} />;
  }

  const inputProps = {
    messageLost: stages[0],
    instantReply: stages[1],
    qualified: stages[2],
    confirmed: stages[3],
    followUp: stages[4],
  };

  return (
    <div className={styles.playerShell}>
      <div className={styles.player}>
        <PlayerErrorBoundary fallback={<StaticPreview stages={stages} buttonLabel={replayLabel} fallbackText={fallbackText} onStart={() => setStarted(false)} />}>
          <LazyPlayer
            component={LazyBrandClip}
            durationInFrames={brandClip.durationInFrames}
            fps={brandClip.fps}
            compositionWidth={brandClip.width}
            compositionHeight={brandClip.height}
            controls
            autoPlay
            inputProps={inputProps}
            style={{ width: "100%", height: "100%" }}
          />
        </PlayerErrorBoundary>
      </div>
      <StaticPreview stages={stages} buttonLabel={replayLabel} fallbackText={fallbackText} onStart={() => setStarted(false)} />
    </div>
  );
}
