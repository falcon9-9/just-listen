import { useEffect, useState } from "react";

function findVideo(player: HTMLElement) {
  return player.querySelector<HTMLVideoElement>("video");
}

export function useVideoElement(player: HTMLElement) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(() =>
    findVideo(player)
  );

  useEffect(() => {
    function syncVideo() {
      setVideo((currentVideo) => {
        const nextVideo = findVideo(player);
        return currentVideo === nextVideo ? currentVideo : nextVideo;
      });
    }

    const observer = new MutationObserver(syncVideo);
    observer.observe(player, {
      childList: true,
      subtree: true
    });
    syncVideo();

    return () => observer.disconnect();
  }, [player]);

  return video;
}

