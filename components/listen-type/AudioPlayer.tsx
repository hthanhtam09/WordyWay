"use client";
import { useEffect, useRef, useState, useMemo } from "react";

export default function AudioPlayer({
    src,
    audioFileId,
    cloudinaryUrl,
    cloudinaryPublicId,
    startMs,
    endMs,
    onReady,
    autoPause = false,
}: {
    src?: string;
    audioFileId?: string;
    cloudinaryUrl?: string;
    cloudinaryPublicId?: string;
    startMs?: number;
    endMs?: number;
    onReady?: (el: HTMLAudioElement) => void;
    autoPause?: boolean;
}) {
    const ref = useRef<HTMLAudioElement>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Use Cloudinary URL if available, otherwise fall back to GridFS or direct src
    const audioSrc = useMemo(() => {
        const url =
            cloudinaryUrl ||
            src ||
            (audioFileId ? `/api/listen-type/audio/${audioFileId}` : undefined);
        if (!url) return undefined;

        // For Cloudinary URLs, add cache busting only on client side
        if (url.includes("cloudinary.com")) {
            // Use cloudinaryPublicId or URL hash for stable cache busting to avoid hydration mismatch
            const cacheKey =
                cloudinaryPublicId || url.split("/").pop()?.split(".")[0] || "cache";
            const separator = url.includes("?") ? "&" : "?";
            return `${url}${separator}t=${cacheKey}`;
        }

        return url;
    }, [cloudinaryUrl, src, audioFileId, cloudinaryPublicId]);

    useEffect(() => {
        if (ref.current) {
            onReady?.(ref.current);
        }
    }, [onReady]);

    useEffect(() => {
        if (ref.current) {
            ref.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    useEffect(() => {
        if (ref.current && typeof startMs === "number") {
            ref.current.currentTime = Math.max(0, startMs / 1000);
        }
    }, [startMs]);

    const handleTimeUpdate = () => {
        if (ref.current && typeof endMs === "number" && autoPause) {
            const currentTimeMs = ref.current.currentTime * 1000;
            if (currentTimeMs >= endMs) {
                ref.current.pause();
                ref.current.currentTime = Math.max(0, startMs || 0) / 1000;
            }
        }
    };

    const handlePlay = () => {
        if (ref.current && typeof startMs === "number") {
            ref.current.currentTime = Math.max(0, startMs / 1000);
        }
    };

    const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPlaybackSpeed(parseFloat(e.target.value));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setPlaybackSpeed((prev) => Math.min(2, prev + 0.25));
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setPlaybackSpeed((prev) => Math.max(0.25, prev - 0.25));
        }
    };

    const handleError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        const error = e.currentTarget.error;
        console.error("Audio error:", error);
        console.error("Audio src:", audioSrc);

        setHasError(true);

        // Check if this might be a placeholder file (only detect very old placeholder patterns)
        const isLikelyPlaceholder =
            audioSrc?.includes("placeholder") ||
            (audioSrc?.includes("v175757489") &&
                audioSrc?.includes("at-a-coffee-shop")) ||
            error?.code === MediaError.MEDIA_ERR_DECODE ||
            error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;

        if (error) {
            switch (error.code) {
                case MediaError.MEDIA_ERR_DECODE:
                    setErrorMessage(
                        isLikelyPlaceholder
                            ? "🔴 PLACEHOLDER FILE DETECTED: This is an auto-generated placeholder. Please replace with real audio content."
                            : "Audio file cannot be decoded. This may be a corrupted audio file."
                    );
                    console.error(
                        "Audio decode error - file may be corrupted or placeholder file"
                    );
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    setErrorMessage("Audio file not found or network error.");
                    console.error(
                        "Audio network error - file not found or network issue"
                    );
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    setErrorMessage(
                        isLikelyPlaceholder
                            ? "🔴 PLACEHOLDER FILE: This appears to be a placeholder file. Please replace with real audio."
                            : "Audio format not supported by browser."
                    );
                    console.error("Audio format not supported or placeholder file");
                    break;
                default:
                    setErrorMessage(
                        isLikelyPlaceholder
                            ? "🔴 PLACEHOLDER FILE: This appears to be a placeholder file. Please replace with real audio."
                            : "Unknown audio error occurred."
                    );
                    console.error("Unknown audio error");
            }
        } else {
            setErrorMessage("Audio failed to load without specific error code.");
        }
    };

    if (!audioSrc) {
        return (
            <div className="w-full rounded-xl bg-muted p-4 text-center text-muted-foreground">
                No audio available
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="w-full rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <div className="text-center">
                    <div className="text-red-600 dark:text-red-400 font-medium mb-2">
                        Audio Playback Error
                    </div>
                    <div className="text-red-500 dark:text-red-300 text-sm mb-3">
                        {errorMessage || "Unable to play audio file"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        This is likely a placeholder file. Please replace with actual audio
                        content.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            <audio
                ref={ref}
                src={audioSrc}
                controls
                className="w-full rounded-xl"
                preload="metadata"
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onError={handleError}
            />

            {/* Speed Control */}
            <div
                className="flex items-center justify-center gap-3 p-3 bg-muted/50 dark:bg-muted/30 rounded-lg"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                aria-label="Speed control"
            >
                <label
                    htmlFor="speed-select"
                    className="text-sm font-medium text-foreground"
                >
                    Speed:
                </label>

                <select
                    id="speed-select"
                    value={playbackSpeed}
                    onChange={handleSpeedChange}
                    className="px-3 py-1.5 text-sm font-medium bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none cursor-pointer min-w-[60px]"
                    aria-label="Select playback speed"
                >
                    <option value={0.25}>0.25x</option>
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={1.75}>1.75x</option>
                    <option value={2}>2x</option>
                </select>
            </div>
        </div>
    );
}
