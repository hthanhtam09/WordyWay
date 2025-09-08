"use client";
import Link from "next/link";
import { useState } from "react";
import { useVideos } from "@/hooks/useVideos";
import { useLanguages } from "@/hooks/useLanguages";
import LanguageSelector from "@/components/LanguageSelector";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

export default function VideosPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<
    string | undefined
  >();
  const { data: videos, isLoading, error } = useVideos(selectedLanguage);
  const { data: languages } = useLanguages();

  const getLanguageInfo = (code: string) => {
    return languages?.find((lang) => lang.code === code);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load videos"
        description={error instanceof Error ? error.message : String(error)}
        actions={
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="block w-full text-center px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Go Home
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to Home"
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
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-foreground mt-4">
                Video Library
              </h1>
              <p className="text-muted-foreground mt-2">
                Select a video to view with interactive transcript
              </p>
            </div>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
          {selectedLanguage && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing videos in: {getLanguageInfo(selectedLanguage)?.flag}{" "}
              {getLanguageInfo(selectedLanguage)?.name}
            </p>
          )}
        </div>

        {videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Link
                key={video._id}
                href={`/videos/${encodeURIComponent(video._id)}`}
                className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow group focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Open video ${video.name}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground group-hover:text-foreground">
                        {video.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getLanguageInfo(video.language)?.flag}{" "}
                        {getLanguageInfo(video.language)?.name}
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground"
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
                {video.durationSec && (
                  <p className="text-muted-foreground text-sm">
                    Duration {Math.floor(video.durationSec / 60)}:
                    {(video.durationSec % 60).toString().padStart(2, "0")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            }
            title="No Videos Available"
            description={
              selectedLanguage
                ? `No videos found for ${
                    getLanguageInfo(selectedLanguage)?.name
                  }. Try selecting All Languages.`
                : "No videos are currently available. Please check back later."
            }
            action={
              <Link
                href="/"
                className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-center"
              >
                Go Home
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
