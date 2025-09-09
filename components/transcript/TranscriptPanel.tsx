"use client";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import type { TranscriptSegment } from "@/lib/types";
import { secToMMSS } from "@/lib/time";
import clsx from "clsx";

type PlayerLike = {
  seekTo?: (time: number, allowSeekAhead?: boolean) => void;
  playVideo?: () => void;
  getPlayerState?: () => number;
  player?: PlayerLike;
  internalPlayer?: PlayerLike;
} | null;

type Props = {
  segments?: TranscriptSegment[];
  rawTranscript?: string;
  playerRef: React.MutableRefObject<unknown>;
  durationSec?: number | null;
  parse?: (text: string) => TranscriptSegment[];
  currentTime?: number;
  title?: string;
};

export default function TranscriptPanel({
  segments,
  rawTranscript,
  playerRef,
  // durationSec,
  parse,
  currentTime = 0,
  title,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [clickedSegmentId, setClickedSegmentId] = useState<string | null>(null);
  const lastActiveIndexRef = useRef<number>(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Parse segments from rawTranscript if segments not provided
  const parsedSegments = useMemo(() => {
    if (segments) return segments;
    if (rawTranscript && parse) return parse(rawTranscript);
    return [];
  }, [segments, rawTranscript, parse]);

  // Helper function to check if a segment is active
  const isSegmentActive = useCallback(
    (
      segment: TranscriptSegment,
      clickedId?: string | null,
      segmentIndex?: number
    ) => {
      const isClicked = clickedId === segment._id;

      // Use same logic as auto-scroll for consistency
      const nextSegment =
        parsedSegments[segmentIndex !== undefined ? segmentIndex + 1 : -1];
      const effectiveEndSec = segment.endSec ?? nextSegment?.startSec;

      const isCurrentTime =
        currentTime >= segment.startSec &&
        (effectiveEndSec == null || currentTime < effectiveEndSec);

      return isClicked || isCurrentTime;
    },
    [currentTime, parsedSegments]
  );

  // Auto-scroll based on video playback time
  useEffect(() => {
    if (!autoScrollEnabled || parsedSegments.length === 0) return;

    // Find the current active segment based on currentTime only
    let activeIndex = -1;

    // First, try to find exact match with proper endSec handling
    for (let i = 0; i < parsedSegments.length; i++) {
      const segment = parsedSegments[i];
      const nextSegment = parsedSegments[i + 1];

      // If segment has endSec, use it; otherwise use next segment's startSec
      const effectiveEndSec = segment.endSec ?? nextSegment?.startSec;

      const isCurrentTime =
        currentTime >= segment.startSec &&
        (effectiveEndSec == null || currentTime < effectiveEndSec);

      if (isCurrentTime) {
        activeIndex = i;
        break;
      }
    }

    // Fallback: if no exact match, find the closest segment
    if (activeIndex === -1) {
      for (let i = 0; i < parsedSegments.length; i++) {
        if (currentTime < parsedSegments[i].startSec) {
          activeIndex = Math.max(0, i - 1);
          break;
        }
      }
      // If currentTime is beyond all segments, use the last segment
      if (activeIndex === -1) {
        activeIndex = parsedSegments.length - 1;
      }
    }

    // Debug logging
    const activeSegment = parsedSegments[activeIndex];
    const nextSegment = parsedSegments[activeIndex + 1];
    const effectiveEndSec = activeSegment?.endSec ?? nextSegment?.startSec;

    console.log("Auto-scroll debug:", {
      currentTime,
      activeIndex,
      lastActiveIndex: lastActiveIndexRef.current,
      segmentsCount: parsedSegments.length,
      autoScrollEnabled,
      segmentStart: activeSegment?.startSec,
      segmentEnd: activeSegment?.endSec,
      effectiveEndSec,
      nextSegmentStart: nextSegment?.startSec,
    });

    // Scroll if the active segment has changed
    if (activeIndex >= 0 && activeIndex !== lastActiveIndexRef.current) {
      lastActiveIndexRef.current = activeIndex;

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const element = listRef.current?.querySelector(
          `[data-seg="${activeIndex}"]`
        ) as HTMLElement | null;

        if (element) {
          console.log(
            "Scrolling to element:",
            element,
            "at index:",
            activeIndex
          );
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        } else {
          console.log("Element not found for index:", activeIndex);
        }
      });
    }
  }, [currentTime, parsedSegments, autoScrollEnabled]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeoutRefValue = timeoutRef.current;
    const scrollTimeoutRefValue = scrollTimeoutRef.current;

    return () => {
      if (timeoutRefValue) {
        clearTimeout(timeoutRefValue);
      }
      if (scrollTimeoutRefValue) {
        clearTimeout(scrollTimeoutRefValue);
      }
    };
  }, []);

  const handleToggleAutoScroll = useCallback(() => {
    setAutoScrollEnabled((prev) => !prev);
  }, []);

  const handleSegmentClick = (startSec: number, segmentId: string) => {
    console.log("Segment clicked:", { startSec, segmentId, currentTime });
    setClickedSegmentId(segmentId);

    // Auto-scroll to clicked segment
    const clickedIndex = parsedSegments.findIndex((s) => s._id === segmentId);
    console.log("Clicked index:", clickedIndex);

    if (clickedIndex >= 0) {
      lastActiveIndexRef.current = clickedIndex;

      // Clear any pending scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        const element = listRef.current?.querySelector(
          `[data-seg="${clickedIndex}"]`
        ) as HTMLElement | null;

        console.log("Scroll element found:", element);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }
      });
    }

    // Clear clicked state after a short delay for visual feedback
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setClickedSegmentId(null);
    }, 1000);

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
    <div className="p-2 lg:p-3 h-full flex flex-col bg-card text-foreground rounded-2xl border border-border shadow-sm">
      <div className="mb-2 lg:mb-3">
        {title && (
          <h2 className="text-lg lg:text-xl font-semibold text-foreground mb-1 lg:mb-2">
            {title}
          </h2>
        )}
        <div className="flex items-center justify-between">
          <div className="text-xs lg:text-sm text-muted-foreground">
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
              "relative inline-flex h-5 lg:h-6 w-9 lg:w-11 items-center rounded-full transition-colors",
              autoScrollEnabled ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 lg:h-5 w-4 lg:w-5 transform rounded-full bg-background transition-transform",
                autoScrollEnabled
                  ? "translate-x-4 lg:translate-x-5"
                  : "translate-x-1"
              )}
            />
          </button>
        </div>
      </div>
      <div
        className="space-y-1 lg:space-y-2 flex-1 min-h-0 overflow-y-auto"
        ref={listRef}
      >
        {parsedSegments.map((segment, index) => {
          const isActive = isSegmentActive(segment, clickedSegmentId, index);

          return (
            <div
              key={segment._id}
              data-seg={index}
              onClick={() => handleSegmentClick(segment.startSec, segment._id)}
              className={clsx(
                "cursor-pointer rounded-lg lg:rounded-xl p-2 lg:p-3 border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "dark:bg-background border-border shadow-sm hover:bg-muted dark:hover:bg-background/90"
                  : "bg-transparent border-transparent hover:bg-muted hover:border-border hover:shadow-sm dark:hover:bg-accent/60"
              )}
              tabIndex={0}
              role="button"
              aria-label={`Jump to ${secToMMSS(
                segment.startSec
              )}: ${segment.text.slice(0, 50)}...`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSegmentClick(segment.startSec, segment._id);
                }
              }}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {secToMMSS(segment.startSec)}
                {segment.endSec && <span> - {secToMMSS(segment.endSec)}</span>}
              </div>
              <div className="leading-relaxed text-sm lg:text-base text-foreground">
                {segment.text}
              </div>
            </div>
          );
        })}

        {parsedSegments.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No transcript segments available.
          </div>
        )}
      </div>
    </div>
  );
}
