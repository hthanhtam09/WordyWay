"use client";
import { useRef, useCallback, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";

type Props = {
  videoId: string;
  onReady?: (player: unknown) => void;
  onTime?: (currentSec: number) => void;
  onEnd?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  playerRef?: React.MutableRefObject<unknown>;
  autoplay?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

export default function YouTubePlayer({
  videoId,
  onReady,
  onTime,
  onEnd,
  onPause,
  onPlay,
  playerRef: externalPlayerRef,
  autoplay = false,
  onFullscreenChange,
}: Props) {
  const internalPlayerRef = useRef<unknown>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeRef = useRef<number>(0);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleReady: YouTubeProps["onReady"] = useCallback(
    (event: Parameters<NonNullable<YouTubeProps["onReady"]>>[0]) => {
      internalPlayerRef.current = event.target;
      if (externalPlayerRef) {
        externalPlayerRef.current = event.target;
      } else {
        console.warn("No external player ref provided!");
      }
      onReady?.(event.target);

      // Attempt autoplay: browsers generally allow autoplay only when muted
      if (autoplay) {
        try {
          (
            event.target as unknown as { playVideo?: () => void }
          )?.playVideo?.();
        } catch {
          // ignore
        }
      }

      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start time tracking
      intervalRef.current = setInterval(() => {
        const t = event.target?.getCurrentTime?.();
        if (typeof t === "number") {
          lastTimeRef.current = t;
          onTime?.(t);
        }
      }, 400);
    },
    [onReady, onTime, externalPlayerRef, autoplay]
  );

  const handleStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event: Parameters<NonNullable<YouTubeProps["onStateChange"]>>[0]) => {
      // Listen for video end (state 0 = ended)
      if (event.data === 0) {
        onEnd?.();
      }

      // Listen for pause state (state 2 = paused)
      if (event.data === 2) {
        // Clear any existing pause timeout
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
        }

        // Delay pause event to distinguish between seeking and actual pause
        pauseTimeoutRef.current = setTimeout(() => {
          const currentTime = event.target?.getCurrentTime?.();
          // Only trigger pause if time hasn't changed significantly (not seeking)
          if (
            typeof currentTime === "number" &&
            Math.abs(currentTime - lastTimeRef.current) < 1
          ) {
            onPause?.();
          }
        }, 100);
      }

      // Listen for play state (state 1 = playing)
      if (event.data === 1) {
        // Clear pause timeout when playing
        if (pauseTimeoutRef.current) {
          clearTimeout(pauseTimeoutRef.current);
          pauseTimeoutRef.current = null;
        }

        onPlay?.();
        // Check if player is in fullscreen mode
        const player = event.target as any;
        if (player?.isFullscreen && typeof player.isFullscreen === "function") {
          const isFullscreen = player.isFullscreen();
          onFullscreenChange?.(isFullscreen);
        }
      }
    },
    [onEnd, onPause, onPlay, onFullscreenChange]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    host: "https://www.youtube.com",
    playerVars: {
      enablejsapi: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 0,
      fs: 1,
      playsinline: 1,
      autoplay: autoplay ? 1 : 0,
      origin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    },
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
        className="w-full h-full"
        iframeClassName="w-full h-full"
      />
    </div>
  );
}

export function seekTo(player: unknown, sec: number) {
  (
    player as { seekTo?: (time: number, allowSeekAhead: boolean) => void }
  )?.seekTo?.(sec, true);
}
