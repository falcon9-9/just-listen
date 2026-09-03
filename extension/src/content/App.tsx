import { useEffect, useRef, useState } from "react";
import { BookmarkTab } from "../components/BookmarkTab";
import { FrostedMask } from "../components/FrostedMask";
import { useVideoElement } from "../core/player/useVideoElement";
import { OcrTestPanel } from "../features/transcript/OcrTestPanel";
import type { NormalizedRect } from "../model/mask";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences
} from "../storage/preferences";

type AppProps = {
  player: HTMLElement;
};

export function App({ player }: AppProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const video = useVideoElement(player);
  const [maskEnabled, setMaskEnabled] = useState(
    DEFAULT_PREFERENCES.maskEnabled
  );
  const [maskRect, setMaskRect] = useState<NormalizedRect>(
    DEFAULT_PREFERENCES.maskRect
  );
  const [revealing, setRevealing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadPreferences().then((preferences) => {
      if (cancelled) {
        return;
      }

      setMaskEnabled(preferences.maskEnabled);
      setMaskRect(preferences.maskRect);
      setHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      void savePreferences({ maskEnabled, maskRect });
    }, 220);

    return () => window.clearTimeout(saveTimer);
  }, [hydrated, maskEnabled, maskRect]);

  function toggleMask() {
    setRevealing(false);
    setMaskEnabled((enabled) => !enabled);
  }

  return (
    <div className="jl-layer" ref={layerRef}>
      {maskEnabled && (
        <FrostedMask
          containerRef={layerRef}
          onChange={setMaskRect}
          rect={maskRect}
          revealing={revealing}
        />
      )}
      <div
        aria-hidden={!revealing}
        aria-live="polite"
        className="jl-reveal-status"
        data-visible={revealing || undefined}
      >
        显示字幕
      </div>
      <BookmarkTab
        active={maskEnabled}
        onRevealChange={setRevealing}
        onToggle={toggleMask}
        revealing={revealing}
      />
      <OcrTestPanel video={video} />
    </div>
  );
}
