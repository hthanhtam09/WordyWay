"use client";
import { useCallback } from "react";
import clsx from "clsx";

type Props = {
  onPlay: () => void;
  isVisible: boolean;
};

export default function VideoPauseOverlay({ onPlay, isVisible }: Props) {
  const handlePlay = useCallback(() => {
    onPlay();
  }, [onPlay]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePlay();
      }
    },
    [handlePlay]
  );

  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm cursor-pointer"
      onClick={handlePlay}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Continue playing video"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Play Icon */}
        <div
          className={clsx(
            "group relative flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center",
            "rounded-full bg-white/90 shadow-lg transition-all duration-200",
            "hover:bg-white hover:scale-105 hover:shadow-xl",
            "dark:bg-gray-800/90 dark:hover:bg-gray-700/90"
          )}
        >
          {/* Play Icon SVG */}
          <svg
            className="h-8 w-8 lg:h-10 lg:w-10 text-gray-800 dark:text-white transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>

        {/* Play Text */}
        <div className="text-center">
          <p className="text-sm lg:text-base font-medium text-white drop-shadow-lg">
            Video paused
          </p>
          <p className="text-xs lg:text-sm text-white/80 drop-shadow-md">
            Click anywhere to continue
          </p>
        </div>
      </div>
    </div>
  );
}
