"use client";

import { useParams, useRouter } from "next/navigation";
import { ILanguage, IVocabulary } from "@/types";
import { createTopicPath, extractMainTopic } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

import { useAsyncData } from "@/hooks/useAsyncData";

export default function LanguageWorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const languageCode = params.language as string;

  const {
    data: language,
    isLoading: isLoadingLanguage,
    error: languageError,
  } = useAsyncData<ILanguage>(
    async () => {
      const response = await fetch("/api/languages");
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No languages available");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch language data");
      }
      const languages = await response.json();
      const foundLanguage = languages.find(
        (lang: ILanguage) => lang.code === languageCode
      );
      if (!foundLanguage) {
        throw new Error("Language not found");
      }
      return foundLanguage;
    },
    { dependencies: [languageCode] }
  );

  const {
    data: vocabulary,
    isLoading: isLoadingVocabulary,
    error: vocabularyError,
  } = useAsyncData<IVocabulary[]>(
    async () => {
      const response = await fetch(
        `/api/vocabulary?languageCode=${languageCode}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          // Return empty array for 404, not an error
          return [];
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch vocabulary");
      }
      return response.json();
    },
    { dependencies: [languageCode] }
  );

  const isLoading = isLoadingLanguage || isLoadingVocabulary;
  const error = languageError || vocabularyError;

  // Check if we have attempted to fetch data at least once
  const hasAttemptedFetch =
    isLoadingLanguage ||
    languageError ||
    language ||
    isLoadingVocabulary ||
    vocabularyError ||
    vocabulary;
  // Group topics by main topic name
  const availableTopics = vocabulary
    ? [...new Set(vocabulary.map((item) => extractMainTopic(item.category)))]
    : [];

  // Handle topic selection and navigation to workbook
  const handleTopicSelect = (topic: string) => {
    router.push(createTopicPath(languageCode, topic));
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorState
        title={error}
        description="The requested language could not be found. Please check the URL or go back to the workbooks page."
        actions={
          <div className="space-y-3">
            <button
              onClick={() => router.push("/workbook")}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Back to Workbooks
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

  // Only show "Language Not Found" when we've attempted to fetch and have no language data
  if (hasAttemptedFetch && !isLoading && !language) {
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        }
        title="Language Not Found"
        description="The requested language could not be found. Please check the URL or go back to the workbooks page."
        action={
          <div className="space-y-3">
            <button
              onClick={() => router.push("/workbook")}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Back to Workbooks
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

  // Ensure language exists before rendering the main content
  if (!language) {
    return null;
  }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/workbook")}
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
            Back to All Workbooks
          </button>
          <h1 className="text-3xl font-bold text-foreground mt-4">
            {language.name} Workbook
          </h1>
          <p className="text-muted-foreground mt-2">
            Choose a topic to start learning {language.name} vocabulary
          </p>
        </div>

        {availableTopics.length === 0 ? (
          <EmptyState
            icon={
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
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
            title="No Topics Available"
            description={`No vocabulary topics are available for ${language.name} at the moment.`}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTopics.map((topic) => (
              <div
                key={topic}
                className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTopicSelect(topic)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleTopicSelect(topic);
                  }
                }}
                tabIndex={0}
                aria-label={`Start learning ${topic} topic`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {topic}
                  </h3>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
