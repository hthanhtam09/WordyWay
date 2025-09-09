"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import YouTubePlayer from "./YouTubePlayer";
import TranscriptPanel from "@/components/transcript/TranscriptPanel";
import VideoEndOverlay from "./VideoEndOverlay";
import VideoPauseOverlay from "./VideoPauseOverlay";

type Props = {
  videoId: string;
  videoTitle: string;
  segments: Array<{
    _id: string;
    videoId: string;
    order: number;
    startSec: number;
    endSec: number | null;
    text: string;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  slug: string;
  durationSec?: number | null;
  onBack?: () => void;
};

export default function FullscreenVideoPlayer({
  videoId,
  videoTitle,
  segments,
  slug,
  durationSec,
  onBack,
}: Props) {
  const playerRef = useRef<unknown>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(durationSec || null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [isVideoPaused, setIsVideoPaused] = useState(false);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsVideoEnded(true);
  }, []);

  const handleReplay = useCallback(() => {
    setIsVideoEnded(false);
    // Reset video to beginning
    const player = playerRef.current as any;
    if (player?.seekTo) {
      player.seekTo(0, true);
    }
    if (player?.playVideo) {
      player.playVideo();
    }
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsVideoPaused(true);
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsVideoPaused(false);
  }, []);

  const handleContinuePlay = useCallback(() => {
    setIsVideoPaused(false);
    const player = playerRef.current as any;
    if (player?.playVideo) {
      player.playVideo();
    }
  }, []);

  // Detect device type and screen size
  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;

      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDeviceType();
    window.addEventListener("resize", checkDeviceType);
    window.addEventListener("orientationchange", checkDeviceType);

    return () => {
      window.removeEventListener("resize", checkDeviceType);
      window.removeEventListener("orientationchange", checkDeviceType);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        handleExitFullscreen();
      }
      if (event.key === "f" || event.key === "F") {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleToggleFullscreen();
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when in fullscreen
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen, handleToggleFullscreen, handleExitFullscreen]);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col lg:flex-row">
        {/* Video Section */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-2 lg:p-4 bg-black/80 text-white">
            <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
              {onBack && (
                <button
                  onClick={onBack}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onBack();
                    }
                  }}
                  className="p-1 lg:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                  tabIndex={0}
                  aria-label="Back to video list"
                >
                  <svg
                    className="w-4 lg:w-5 h-4 lg:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              <h1 className="text-sm lg:text-lg font-semibold truncate">
                {videoTitle}
              </h1>
            </div>
          </div>

          {/* Video Player */}
          <div className="flex-1 p-2 lg:p-4 relative">
            <YouTubePlayer
              videoId={videoId}
              playerRef={playerRef}
              autoplay={true}
              onReady={(p) => {
                const d = (p as any)?.getDuration?.();
                if (typeof d === "number" && d > 0) setDuration(Math.floor(d));
              }}
              onTime={(t) => setCurrentTime(t)}
              onEnd={handleVideoEnd}
              onPause={handleVideoPause}
              onPlay={handleVideoPlay}
            />
            <VideoEndOverlay onReplay={handleReplay} isVisible={isVideoEnded} />
            <VideoPauseOverlay
              onPlay={handleContinuePlay}
              isVisible={isVideoPaused}
            />
          </div>
        </div>

        {/* Transcript Section - Responsive */}
        <div
          className={`
          ${isMobile ? "w-full h-64 border-t border-gray-700" : ""}
          ${isTablet ? "w-80 border-l border-gray-700" : ""}
          ${!isMobile && !isTablet ? "w-96 border-l border-gray-700" : ""}
          bg-gray-900
        `}
        >
          {segments && segments.length > 0 ? (
            <TranscriptPanel
              segments={segments}
              playerRef={playerRef}
              currentTime={currentTime}
              title="Transcript"
            />
          ) : (
            <div className="p-4 lg:p-6 text-center text-gray-400">
              No transcript available for this video.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-sm">
      <YouTubePlayer
        videoId={videoId}
        playerRef={playerRef}
        autoplay={false}
        onReady={(p) => {
          const d = (p as any)?.getDuration?.();
          if (typeof d === "number" && d > 0) setDuration(Math.floor(d));
        }}
        onTime={(t) => setCurrentTime(t)}
        onEnd={handleVideoEnd}
        onPause={handleVideoPause}
        onPlay={handleVideoPlay}
      />

      {/* Fullscreen Button Overlay */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleToggleFullscreen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleToggleFullscreen();
            }
          }}
          className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm"
          tabIndex={0}
          aria-label="Enter fullscreen mode"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>
      </div>
      <VideoEndOverlay onReplay={handleReplay} isVisible={isVideoEnded} />
      <VideoPauseOverlay
        onPlay={handleContinuePlay}
        isVisible={isVideoPaused}
      />
    </div>
  );
}
