"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ILanguage, IVocabulary } from "@/types";
import VocabularyList from "@/components/VocabularyList";
import { decodeTopicSlug } from "@/lib/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorState from "@/components/ErrorState";
import EmptyState from "@/components/EmptyState";

import { useAsyncData } from "@/hooks/useAsyncData";

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
  } = useAsyncData<ILanguage>(async () => {
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
  });

  const {
    data: availableTopics,
    isLoading: isLoadingTopics,
    error: topicsError,
  } = useAsyncData<string[]>(async () => {
    const response = await fetch(
      `/api/vocabulary?languageCode=${languageCode}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array for 404, not an error
        return [];
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch topics");
    }
    const data = (await response.json()) as IVocabulary[];
    const topics = [...new Set(data.map((item: IVocabulary) => item.category))];
    return topics;
  });

  // Decode topic when availableTopics changes
  useEffect(() => {
    if (availableTopics && availableTopics.length > 0) {
      const decoded = decodeTopicSlug(topicSlug, availableTopics);
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
  } = useAsyncData<IVocabulary[]>(
    async () => {
      if (!decodedTopic) return [];

      const response = await fetch(
        `/api/vocabulary?languageCode=${languageCode}&category=${encodeURIComponent(
          decodedTopic
        )}`
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
    {
      dependencies: [languageCode, decodedTopic],
      skip: !decodedTopic, // Skip fetching until we have the decoded topic
    }
  );

  const isLoading = isLoadingLanguage || isLoadingTopics || isLoadingVocabulary;
  const error = languageError || topicsError || vocabularyError;

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

  if (!isLoading || !language || !decodedTopic) {
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

  if (!vocabulary || vocabulary.length === 0) {
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

        <VocabularyList vocabulary={vocabulary} language={language} />
      </div>
    </div>
  );
}
