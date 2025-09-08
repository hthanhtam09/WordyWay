"use client";
import { useRef, useCallback } from "react";
import YouTube, { YouTubeProps } from "react-youtube";

type Props = {
    videoId: string;
    onReady?: (player: unknown) => void;
    onTime?: (currentSec: number) => void;
    playerRef?: React.MutableRefObject<unknown>;
};

export default function YouTubePlayer({
    videoId,
    onReady,
    onTime,
    playerRef: externalPlayerRef,
}: Props) {
    const internalPlayerRef = useRef<unknown>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleReady: YouTubeProps["onReady"] = useCallback(
        (event: Parameters<NonNullable<YouTubeProps["onReady"]>>[0]) => {
            internalPlayerRef.current = event.target;
            if (externalPlayerRef) {
                externalPlayerRef.current = event.target;
            } else {
                console.warn("No external player ref provided!");
            }
            onReady?.(event.target);

            // Clear existing interval
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // Start time tracking
            intervalRef.current = setInterval(() => {
                const t = event.target?.getCurrentTime?.();
                if (typeof t === "number") {
                    onTime?.(t);
                }
            }, 400);
        },
        [onReady, onTime, externalPlayerRef]
    );

    const handleStateChange: YouTubeProps["onStateChange"] =
        useCallback(() => { }, []);

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
