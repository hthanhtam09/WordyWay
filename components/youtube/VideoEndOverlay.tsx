"use client";
import { useCallback } from "react";
import clsx from "clsx";

type Props = {
    onReplay: () => void;
    isVisible: boolean;
};

export default function VideoEndOverlay({ onReplay, isVisible }: Props) {
    const handleReplay = useCallback(() => {
        onReplay();
    }, [onReplay]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleReplay();
            }
        },
        [handleReplay]
    );

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
                {/* Replay Icon */}
                <button
                    onClick={handleReplay}
                    onKeyDown={handleKeyDown}
                    className={clsx(
                        "group relative flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center cursor-pointer",
                        "rounded-full bg-white/90 shadow-lg transition-all duration-200",
                        "hover:bg-white hover:scale-105 hover:shadow-xl",
                        "focus:outline-none focus:ring-4 focus:ring-white/50",
                        "dark:bg-gray-800/90 dark:hover:bg-gray-700/90"
                    )}
                    tabIndex={0}
                    role="button"
                    aria-label="Replay video"
                >
                    {/* Replay Icon SVG */}
                    <svg
                        className="h-8 w-8 lg:h-10 lg:w-10 text-gray-800 dark:text-white transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-gray-100"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5v3h4v4h-4v3z" />
                    </svg>
                </button>

                {/* Replay Text */}
                <div className="text-center">
                    <p className="text-sm lg:text-base font-medium text-white drop-shadow-lg">
                        Video ended
                    </p>
                    <p className="text-xs lg:text-sm text-white/80 drop-shadow-md">
                        Click to replay
                    </p>
                </div>
            </div>
        </div>
    );
}
