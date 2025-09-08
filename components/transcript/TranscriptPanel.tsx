"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { TranscriptSegment } from "@/lib/types";
import { secToHHMMSS } from "@/lib/time";
import clsx from "clsx";

type PlayerLike = {
    seekTo?: (time: number, allowSeekAhead?: boolean) => void;
    playVideo?: () => void;
    getPlayerState?: () => number;
    player?: PlayerLike;
    internalPlayer?: PlayerLike;
} | null;

type Props = {
    rawTranscript: string;
    playerRef: React.MutableRefObject<unknown>;
    durationSec?: number | null;
    parse: (text: string) => TranscriptSegment[];
    currentTime?: number;
    title?: string;
};

export default function TranscriptPanel({
    rawTranscript,
    playerRef,
    parse,
    currentTime = 0,
    title,
}: Props) {
    const listRef = useRef<HTMLDivElement>(null);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

    const segments = useMemo(() => parse(rawTranscript), [rawTranscript, parse]);

    useEffect(() => {
        if (!autoScrollEnabled) return;
        const activeIndex = segments.findIndex(
            (s) =>
                currentTime >= s.startSec &&
                (s.endSec == null || currentTime < s.endSec)
        );

        if (activeIndex >= 0) {
            const element = listRef.current?.querySelector(
                `[data-seg="${activeIndex}"]`
            ) as HTMLElement | null;
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [currentTime, segments, autoScrollEnabled]);

    const handleToggleAutoScroll = useCallback(() => {
        setAutoScrollEnabled((prev) => !prev);
    }, []);

    const handleSegmentClick = (startSec: number) => {
        const root = playerRef.current as PlayerLike;
        if (!root) {
            console.warn("Player reference is null or undefined");
            return;
        }

        // Try to resolve the underlying player instance across common wrappers
        const resolvedPlayer =
            root?.seekTo || root?.playVideo
                ? root
                : root?.player?.seekTo || root?.player?.playVideo
                    ? root.player
                    : root?.internalPlayer?.seekTo || root?.internalPlayer?.playVideo
                        ? root.internalPlayer
                        : null;

        if (!resolvedPlayer) {
            console.warn("No working player instance found on refs");
            return;
        }

        try {
            // Seek first
            if (typeof resolvedPlayer.seekTo === "function") {
                resolvedPlayer.seekTo(startSec, true);
            }

            // Always try to play in case it's paused/cued
            if (typeof resolvedPlayer.playVideo === "function") {
                resolvedPlayer.playVideo();
            }

            // Best-effort retry if state is not playing/buffering shortly after
            const tryForcePlay = () => {
                const state = resolvedPlayer?.getPlayerState?.();
                // YT states: 1 playing, 3 buffering, 2 paused, 5 cued
                if (
                    state !== 1 &&
                    state !== 3 &&
                    typeof resolvedPlayer.playVideo === "function"
                ) {
                    resolvedPlayer.playVideo();
                }
            };

            // Small delayed checks to ensure playback resumes
            setTimeout(tryForcePlay, 60);
            setTimeout(tryForcePlay, 180);
        } catch (error) {
            console.error("Error seeking/playing video:", error);
        }
    };

    return (
        <div className="p-3 h-full flex flex-col bg-card text-foreground rounded-2xl border border-border shadow-sm">
            <div className="mb-3">
                {title && (
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                        {title}
                    </h2>
                )}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Auto-scroll transcript
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleAutoScroll}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleToggleAutoScroll();
                        }}
                        role="switch"
                        aria-checked={autoScrollEnabled}
                        aria-label="Toggle auto scroll transcript"
                        tabIndex={0}
                        className={clsx(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            autoScrollEnabled ? "bg-primary" : "bg-muted"
                        )}
                    >
                        <span
                            className={clsx(
                                "inline-block h-5 w-5 transform rounded-full bg-background transition-transform",
                                autoScrollEnabled ? "translate-x-5" : "translate-x-1"
                            )}
                        />
                    </button>
                </div>
            </div>
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto" ref={listRef}>
                {segments.map((segment, index) => {
                    const isActive =
                        currentTime >= segment.startSec &&
                        (segment.endSec == null || currentTime < segment.endSec);

                    return (
                        <div
                            key={segment._id}
                            data-seg={index}
                            onClick={() => handleSegmentClick(segment.startSec)}
                            className={clsx(
                                "cursor-pointer rounded-xl p-3 border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                isActive
                                    ? "dark:bg-background border-border shadow-sm hover:bg-muted dark:hover:bg-background/90"
                                    : "bg-transparent border-transparent hover:bg-muted hover:border-border hover:shadow-sm dark:hover:bg-accent/60"
                            )}
                            tabIndex={0}
                            role="button"
                            aria-label={`Jump to ${secToHHMMSS(
                                segment.startSec
                            )}: ${segment.text.slice(0, 50)}...`}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    handleSegmentClick(segment.startSec);
                                }
                            }}
                        >
                            <div className="text-xs text-muted-foreground mb-1">
                                {secToHHMMSS(segment.startSec)}
                                {segment.endSec && (
                                    <span> - {secToHHMMSS(segment.endSec)}</span>
                                )}
                            </div>
                            <div className="leading-relaxed text-foreground">
                                {segment.text}
                            </div>
                        </div>
                    );
                })}

                {segments.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        No transcript segments available.
                    </div>
                )}
            </div>
        </div>
    );
}
