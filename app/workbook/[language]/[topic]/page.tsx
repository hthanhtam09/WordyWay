"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import TopicTabs from "@/components/TopicTabs";
import { decodeTopicSlug, extractMainTopic } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";
import { api } from "@/lib/api";
import type { ILanguage, IVocabulary } from "@/types";

export default function WorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const languageCode = params.language as string;
  const topicSlug = params.topic as string;

  const [decodedTopic, setDecodedTopic] = useState<string>("");

  const {
    data: language,
    isLoading: isLoadingLanguage,
    error: languageError,
  } = useQuery({
    queryKey: ["language", languageCode],
    queryFn: () => api.fetchLanguageByCode(languageCode) as Promise<ILanguage>,
    enabled: !!languageCode,
  });

  const {
    data: availableTopics,
    isLoading: isLoadingTopics,
    error: topicsError,
  } = useQuery({
    queryKey: ["topics", languageCode],
    queryFn: () => api.fetchTopics(languageCode) as Promise<string[]>,
    enabled: !!languageCode,
  });

  // Decode topic when availableTopics changes
  useEffect(() => {
    if (availableTopics && availableTopics.length > 0) {
      // Extract main topics from all available topics
      const mainTopics = [
        ...new Set(availableTopics.map((topic) => extractMainTopic(topic))),
      ];
      const decoded = decodeTopicSlug(topicSlug, mainTopics);
      if (!decoded) {
        // If topic not found, redirect to language workbook
        router.push(`/workbook/${languageCode}`);
        return;
      }
      setDecodedTopic(decoded);
    }
  }, [availableTopics, topicSlug, languageCode, router]);

  const {
    data: vocabulary,
    isLoading: isLoadingVocabulary,
    error: vocabularyError,
  } = useQuery({
    queryKey: ["vocabulary", languageCode],
    queryFn: () => api.fetchVocabulary(languageCode) as Promise<IVocabulary[]>,
    enabled: !!languageCode,
  });

  // Filter vocabulary to include both words and phrases for the main topic
  const filteredVocabulary: IVocabulary[] = (vocabulary || []).filter(
    (item) => extractMainTopic(item.category) === decodedTopic
  );

  const isLoading = isLoadingLanguage || isLoadingTopics || isLoadingVocabulary;
  const error =
    languageError?.message || topicsError?.message || vocabularyError?.message;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <ErrorState
        title={error}
        description={
          error === "Language not found"
            ? "The requested language could not be found. Please check the URL or go back to the workbooks page."
            : error === "Topic not found"
              ? "The requested topic could not be found. Please check the URL or go back to the language workbook."
              : "Something went wrong. Please try again or go back to the previous page."
        }
        actions={
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/workbook/${languageCode}`)}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Back to {languageCode.toUpperCase()} Workbook
            </button>
            <button
              onClick={() => router.push("/workbook")}
              className="w-full px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              All Workbooks
            </button>
          </div>
        }
      />
    );
  }

  if (!language || !decodedTopic) {
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
        title="Loading Topic..."
        description="Please wait while we load the topic information."
      />
    );
  }

  if (!filteredVocabulary || filteredVocabulary.length === 0) {
    return (
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
        title="No Vocabulary Found"
        description={`No vocabulary items found for the topic "${decodedTopic}" in ${language.name}.`}
        action={
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/workbook/${languageCode}`)}
              className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Back to {language.name} Workbook
            </button>
            <button
              onClick={() => router.push("/workbook")}
              className="w-full px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              All Workbooks
            </button>
          </div>
        }
      />
    );
  }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push(`/workbook/${languageCode}`)}
            className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
            Back to {language.name} Workbook
          </button>
          <h1 className="text-3xl font-bold text-card-foreground mt-4">
            {decodedTopic}
          </h1>
          <p className="text-muted-foreground mt-2">
            Learn vocabulary for the {decodedTopic} topic in {language.name}
          </p>
        </div>

        <TopicTabs vocabulary={filteredVocabulary} language={language} />
      </div>
    </div>
  );
}
