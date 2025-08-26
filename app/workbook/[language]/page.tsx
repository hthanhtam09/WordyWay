"use client";

import { useParams, useRouter } from "next/navigation";
import { ILanguage, IVocabulary } from "@/types";
import { createTopicPath } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
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
        throw new Error("Failed to fetch language data");
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
        throw new Error("Failed to fetch vocabulary");
      }
      return response.json();
    },
    { dependencies: [languageCode] }
  );

  const isLoading = isLoadingLanguage || isLoadingVocabulary;
  const error = languageError || vocabularyError;
  const availableTopics = vocabulary
    ? [...new Set(vocabulary.map((item) => item.category))]
    : [];

  // Handle topic selection and navigation to workbook
  const handleTopicSelect = (topic: string) => {
    router.push(createTopicPath(languageCode, topic));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600 mb-6">
            The requested language could not be found. Please check the URL or
            go back to the workbooks page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/workbook")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Workbooks
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!language) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
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
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Language Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The requested language could not be found. Please check the URL or
            go back to the workbooks page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/workbook")}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Workbooks
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.push("/workbook")}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              {language.name} Workbook
            </h1>
            <p className="text-gray-600 mt-2">
              Choose a topic to start learning {language.name} vocabulary
            </p>
          </div>

          {availableTopics.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No Topics Available
              </h2>
              <p className="text-gray-600 mb-6">
                No vocabulary topics are available for {language.name} at the
                moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTopics.map((topic) => (
                <div
                  key={topic}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleTopicSelect(topic)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleTopicSelect(topic);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Start learning ${topic} topic`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {topic}
                    </h3>
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                  <p className="text-gray-600 text-sm">
                    Click to start learning vocabulary for this topic
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
