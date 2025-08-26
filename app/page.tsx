"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ILanguage } from "@/types";
import LanguageSelector from "@/components/LanguageSelector";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";

export default function HomePage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<ILanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<ILanguage | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch("/api/languages");
        if (response.ok) {
          const data = await response.json();
          setLanguages(data);
          if (data.length > 0) {
            setSelectedLanguage(data[0]);
          }
        } else {
          const errorData = await response.json();
          if (response.status === 404) {
            // No languages available is not an error, just empty state
            setLanguages([]);
          } else {
            setError(errorData.error || "Failed to fetch languages");
          }
        }
      } catch (error) {
        console.error("Error fetching languages:", error);
        setError("Failed to fetch languages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const handleLanguageChange = (language: ILanguage) => {
    setSelectedLanguage(language);
  };

  const handleStartLearning = () => {
    if (selectedLanguage) {
      router.push(`/workbook/${selectedLanguage.code}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <EmptyState
        icon={
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
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
        title="Error Loading Languages"
        description={error}
        action={
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        }
      />
    );
  }

  return (
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-primary"
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
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to WordyWay
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Master pronunciation and vocabulary in multiple languages with our
            interactive learning platform.
          </p>
        </div>

        {languages.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            <LanguageSelector
              languages={languages}
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />
            <div className="mt-8 text-center">
              <button
                onClick={handleStartLearning}
                disabled={!selectedLanguage}
                className="px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                Start Learning
              </button>
            </div>
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            }
            title="No Languages Available"
            description="No languages are currently available for learning. Please check back later."
          />
        )}

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Why Choose WordyWay?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary"
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
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Interactive Learning
              </h3>
              <p className="text-muted-foreground">
                Practice pronunciation with real-time feedback and audio
                examples.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Structured Content
              </h3>
              <p className="text-muted-foreground">
                Organized vocabulary by topics and categories for systematic
                learning.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Fast Progress
              </h3>
              <p className="text-muted-foreground">
                Track your learning progress and master new vocabulary quickly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
