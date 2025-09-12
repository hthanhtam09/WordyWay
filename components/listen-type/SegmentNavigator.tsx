"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AudioPlayer from "./AudioPlayer";
import SegmentInput from "./SegmentInput";
import FullTranscript from "./FullTranscript";
import { Skeleton } from "@/components/ui/Skeleton";

interface Segment {
    order: number;
    text: string;
    audioUrl?: string; // Each segment can have its own audio
    cloudinaryUrl?: string; // Cloudinary URL for the segment
    cloudinaryPublicId?: string; // Cloudinary public ID for the segment
    startMs: number;
    endMs: number;
}

type SegmentStatus = "not-started" | "correct" | "incorrect";

interface SegmentProgress {
    [segmentIndex: number]: SegmentStatus;
}

interface SegmentNavigatorProps {
    segments: Segment[];
    audioFileId?: string;
    title: string;
    fullTranscript?: string;
    slug: string;
}

export default function SegmentNavigator({
    segments,
    audioFileId,
    title,
    fullTranscript,
    slug,
}: SegmentNavigatorProps) {
    const router = useRouter();
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<
        "practice" | "transcript" | "review"
    >("practice");
    const [isTabLoading, setIsTabLoading] = useState(false);
    const [segmentProgress, setSegmentProgress] = useState<SegmentProgress>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load progress from localStorage on mount
    useEffect(() => {
        const savedProgress = localStorage.getItem(`segment-progress-${slug}`);
        if (savedProgress) {
            try {
                setSegmentProgress(JSON.parse(savedProgress));
            } catch (error) {
                console.error("Failed to parse saved progress:", error);
            }
        }
    }, [slug]);

    // Save progress to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(
            `segment-progress-${slug}`,
            JSON.stringify(segmentProgress)
        );
    }, [segmentProgress, slug]);

    // Get incorrect segments for review tab
    const incorrectSegments = segments.filter(
        (_, index) => segmentProgress[index] === "incorrect"
    );

    // Calculate progress statistics
    const completedSegments = Object.values(segmentProgress).filter(
        (status) => status === "correct" || status === "incorrect"
    ).length;
    const correctSegments = Object.values(segmentProgress).filter(
        (status) => status === "correct"
    ).length;

    const currentSegment = segments[currentSegmentIndex];
    const isLastSegment = currentSegmentIndex === segments.length - 1;
    const isFirstSegment = currentSegmentIndex === 0;

    const handleNextSegment = () => {
        if (currentSegmentIndex < segments.length - 1) {
            setCurrentSegmentIndex(currentSegmentIndex + 1);
        }
    };

    const handlePrevSegment = () => {
        if (currentSegmentIndex > 0) {
            setCurrentSegmentIndex(currentSegmentIndex - 1);
        }
    };

    const handleTabChange = (tab: "practice" | "transcript" | "review") => {
        if (tab !== activeTab) {
            setIsTabLoading(true);
            setActiveTab(tab);

            // Simulate loading time for better UX
            setTimeout(() => {
                setIsTabLoading(false);
            }, 300);
        }
    };

    const handleSegmentResult = useCallback(
        (segmentIndex: number, isCorrect: boolean) => {
            setSegmentProgress((prev) => ({
                ...prev,
                [segmentIndex]: isCorrect ? "correct" : "incorrect",
            }));
        },
        []
    );

    const handleJumpToSegment = (segmentIndex: number) => {
        setCurrentSegmentIndex(segmentIndex);
        setActiveTab("practice");
    };

    const getSegmentStatusColor = (status: SegmentStatus) => {
        switch (status) {
            case "correct":
                return "bg-emerald-500";
            case "incorrect":
                return "bg-red-500";
            default:
                return "bg-gray-300";
        }
    };

    return (
        <div className="bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <button
                        onClick={() => router.push("/listen-type")}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
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
                        Back to Listen & Type
                    </button>
                    <h1 className="text-3xl font-bold text-foreground mt-4">
                        {title.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => handleTabChange("practice")}
                        disabled={isTabLoading}
                        className={`px-4 py-2 rounded-lg border transition-colors ${activeTab === "practice"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "border-border hover:bg-muted"
                            } ${isTabLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        Practice Segments
                    </button>
                    <button
                        onClick={() => handleTabChange("review")}
                        disabled={isTabLoading}
                        className={`px-4 py-2 rounded-lg border transition-colors ${activeTab === "review"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "border-border hover:bg-muted"
                            } ${isTabLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        Review Mistakes ({incorrectSegments.length})
                    </button>
                    <button
                        onClick={() => handleTabChange("transcript")}
                        disabled={isTabLoading}
                        className={`px-4 py-2 rounded-lg border transition-colors ${activeTab === "transcript"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "border-border hover:bg-muted"
                            } ${isTabLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        Full Transcript
                    </button>
                </div>

                {/* Loading Skeleton */}
                {isTabLoading && (
                    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                        <div className="space-y-6">
                            {/* Progress skeleton */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-2 w-full" />
                            </div>

                            {/* Audio player skeleton */}
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <div className="flex justify-center space-x-4">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </div>
                            </div>

                            {/* Segment input skeleton */}
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-10 w-32" />
                            </div>

                            {/* Navigation skeleton */}
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-10 w-20" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Practice Tab */}
                {activeTab === "practice" && !isTabLoading && (
                    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                        {/* Progress indicator */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                <span>
                                    Segment {currentSegmentIndex + 1} of {segments.length}
                                </span>
                                <span>
                                    {correctSegments}/{completedSegments} correct (
                                    {Math.round(
                                        (correctSegments / Math.max(completedSegments, 1)) * 100
                                    )}
                                    %)
                                </span>
                            </div>

                            {/* Overall progress bar */}
                            <div className="w-full bg-muted rounded-full h-2 mb-3">
                                <div
                                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(completedSegments / segments.length) * 100}%`,
                                    }}
                                />
                            </div>

                            {/* Segment status indicators */}
                            <div className="flex gap-1 mb-2">
                                {segments.map((_, index) => {
                                    const status = segmentProgress[index] || "not-started";
                                    const isCurrent = index === currentSegmentIndex;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleJumpToSegment(index)}
                                            className={`flex-1 h-8 rounded text-xs font-medium transition-all hover:scale-105 ${isCurrent ? "ring-2 ring-emerald-500 ring-offset-1" : ""
                                                } ${getSegmentStatusColor(status)} ${status === "not-started"
                                                    ? "text-gray-600"
                                                    : "text-white"
                                                }`}
                                            title={`Segment ${index + 1}: ${status === "not-started" ? "Not started" : status === "correct" ? "Correct" : "Incorrect"}`}
                                        >
                                            {index + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                    <span>Not started</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                                    <span>Correct</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                    <span>Incorrect</span>
                                </div>
                            </div>
                        </div>

                        {/* Audio Player */}
                        <div className="mb-6">
                            <AudioPlayer
                                audioFileId={audioFileId}
                                src={currentSegment.audioUrl} // This now contains Cloudinary URL from page component
                                cloudinaryUrl={currentSegment.cloudinaryUrl} // Use Cloudinary URL if available
                                cloudinaryPublicId={currentSegment.cloudinaryPublicId}
                                startMs={currentSegment.startMs}
                                endMs={currentSegment.endMs}
                                autoPause={false} // Disable auto-pause to prevent cutting off
                                onReady={(el) => (audioRef.current = el)}
                            />
                        </div>

                        {/* Current Segment */}
                        <div className="mb-6">
                            <SegmentInput
                                key={currentSegmentIndex}
                                seg={currentSegment}
                                index={currentSegmentIndex}
                                onResult={handleSegmentResult}
                            />
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handlePrevSegment}
                                disabled={isFirstSegment}
                                className={`px-4 py-2 rounded-lg border ${isFirstSegment
                                    ? "border-muted text-muted-foreground cursor-not-allowed"
                                    : "border-border hover:bg-muted"
                                    }`}
                            >
                                ← Previous
                            </button>

                            <div className="text-sm text-muted-foreground">
                                {currentSegmentIndex + 1} / {segments.length}
                            </div>

                            <button
                                onClick={handleNextSegment}
                                disabled={isLastSegment}
                                className={`px-4 py-2 rounded-lg border ${isLastSegment
                                    ? "border-muted text-muted-foreground cursor-not-allowed"
                                    : "border-border hover:bg-muted"
                                    }`}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}

                {/* Review Tab */}
                {activeTab === "review" && !isTabLoading && (
                    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground mb-2">
                                Review Mistakes
                            </h2>
                            <p className="text-muted-foreground">
                                Practice the segments you got wrong. Click on any segment to
                                jump to it.
                            </p>
                        </div>

                        {incorrectSegments.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🎉</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    No mistakes to review!
                                </h3>
                                <p className="text-muted-foreground">
                                    Great job! You haven&apos;t made any mistakes yet, or
                                    you&apos;ve already corrected them all.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {incorrectSegments.map((segment) => {
                                    const originalIndex = segments.findIndex(
                                        (s) => s.order === segment.order
                                    );
                                    return (
                                        <div
                                            key={segment.order}
                                            className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                        Segment {originalIndex + 1}
                                                    </span>
                                                    <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">
                                                        Incorrect
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleJumpToSegment(originalIndex)}
                                                    className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
                                                >
                                                    Practice Again
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                {segment.text}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Transcript Tab */}
                {activeTab === "transcript" && !isTabLoading && (
                    <FullTranscript
                        title={title}
                        fullTranscript={fullTranscript}
                        slug={slug}
                    />
                )}
            </div>
        </div>
    );
}
