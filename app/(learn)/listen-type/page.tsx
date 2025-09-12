"use client";
import { useRouter } from "next/navigation";
import { useListenTopics } from "@/hooks/useListenTopics";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

export default function ListenTypeHome() {
  const router = useRouter();
  const { data: topics, isLoading, error } = useListenTopics();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <ErrorState
            title="Failed to load topics"
            description={error instanceof Error ? error.message : String(error)}
            actions={
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-3 sm:py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation text-sm sm:text-base font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full px-4 py-3 sm:py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors touch-manipulation text-sm sm:text-base font-medium"
                >
                  Go Home
                </button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <EmptyState
            icon={
              <svg
                className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            }
            title="No Topics Available"
            description="No listen & type topics are currently available. Please check back later."
            action={
              <button
                onClick={() => router.push("/")}
                className="w-full px-4 py-3 sm:py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors touch-manipulation text-sm sm:text-base font-medium"
              >
                Go Home
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center text-sm sm:text-base font-medium text-muted-foreground hover:text-foreground transition-colors touch-manipulation mb-4"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
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
            Back to Home
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Listen & Type
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Practice listening and typing with interactive audio segments
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {topics.map((topic) => (
            <div
              key={topic.slug}
              className="bg-card rounded-lg shadow-sm border border-border p-5 sm:p-6 hover:shadow-md active:shadow-lg transition-all duration-200 cursor-pointer touch-manipulation min-h-[160px] sm:min-h-[180px] flex flex-col justify-between"
              onClick={() => router.push(`/listen-type/${topic.slug}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(`/listen-type/${topic.slug}`);
                }
              }}
              tabIndex={0}
              aria-label={`Start listening practice: ${topic.slug}`}
              role="button"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-base sm:text-lg font-semibold text-card-foreground leading-tight break-words"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {topic.slug
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {topic.segments?.length || 0} segments
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tap to start listening and typing practice
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
