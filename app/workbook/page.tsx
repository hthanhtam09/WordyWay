"use client";

import { useRouter } from "next/navigation";
import { ILanguage } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

import { useAsyncData } from "@/hooks/useAsyncData";

export default function WorkbookPage() {
  const router = useRouter();

  const {
    data: languages,
    isLoading,
    error,
  } = useAsyncData<ILanguage[]>(async () => {
    const response = await fetch("/api/languages");
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array for 404, not an error
        return [];
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch languages");
    }
    return response.json();
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load languages"
        description={error}
        actions={
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Go Home
            </button>
          </div>
        }
      />
    );
  }

  if (!languages || languages.length === 0) {
    return (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        }
        title="No Languages Available"
        description="No languages are currently available for learning. Please check back later."
        action={
          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        }
      />
    );
  }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
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
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-foreground mt-4">
            Language Workbooks
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose a language to start your learning journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((language) => (
            <div
              key={language.code}
              className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/workbook/${language.code}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  router.push(`/workbook/${language.code}`);
                }
              }}
              tabIndex={0}
              aria-label={`Start learning ${language.name}`}
            >
              <div className="flex items-center justify-between mb-4">
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
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {language.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language.code.toUpperCase()}
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
              <p className="text-muted-foreground text-sm">
                Click to start learning {language.name} vocabulary
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
