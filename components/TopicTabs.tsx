"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import VocabularyList from "./VocabularyList";
import type { ILanguage, IVocabulary } from "@/types";
import { getContentType } from "@/lib/utils";

interface TopicTabsProps {
    vocabulary: IVocabulary[];
    language: ILanguage;
}

const TopicTabs: React.FC<TopicTabsProps> = ({ vocabulary, language }) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Group vocabulary by content type using utility function
    const groupedVocabulary = vocabulary.reduce((acc, item) => {
        const contentType = getContentType(item.category);

        if (!acc[contentType]) {
            acc[contentType] = [];
        }
        acc[contentType].push(item);
        return acc;
    }, {} as { [key: string]: IVocabulary[] });

    const tabs = [
        {
            id: "vocabulary",
            label: "Vocabulary",
            count: groupedVocabulary.vocabulary?.length || 0,
        },
        {
            id: "phrases",
            label: "Phrases",
            count: groupedVocabulary.phrases?.length || 0,
        },
    ].filter((tab) => tab.count > 0);

    // Get initial tab from URL or default to first available tab
    const defaultActiveTab = tabs.length > 0 ? tabs[0].id : "vocabulary";
    const initialTab = searchParams.get("tab") || defaultActiveTab;
    const [activeTab, setActiveTab] = useState<string>(initialTab);

    // Update active tab when vocabulary changes or URL changes
    useEffect(() => {
        const tabFromUrl = searchParams.get("tab");
        if (tabFromUrl && tabs.find((tab) => tab.id === tabFromUrl)) {
            setActiveTab(tabFromUrl);
        } else if (tabs.length > 0 && !tabs.find((tab) => tab.id === activeTab)) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab, searchParams]);

    const currentVocabulary = groupedVocabulary[activeTab] || [];

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);

        // Update URL with new tab
        const params = new URLSearchParams(searchParams);
        params.set("tab", tabId);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleTabClick(tabId);
        }
    };

    return (
        <div className="w-full">
            {/* Tab Navigation */}
            <div className="border-b border-border mb-6">
                <nav
                    className="flex space-x-8 overflow-x-auto"
                    aria-label="Topic sections"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            onKeyDown={(e) => handleKeyDown(e, tab.id)}
                            className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors cursor-pointer
                ${activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-600"
                                }
              `}
                            aria-current={activeTab === tab.id ? "page" : undefined}
                            aria-label={`${tab.label} section with ${tab.count} items`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {currentVocabulary.length > 0 ? (
                    <VocabularyList vocabulary={currentVocabulary} language={language} />
                ) : (
                    <div className="text-center py-12">
                        <svg
                            className="w-12 h-12 text-muted-foreground mx-auto mb-4"
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
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            No {tabs.find((t) => t.id === activeTab)?.label} Found
                        </h3>
                        <p className="text-muted-foreground">
                            No {tabs.find((t) => t.id === activeTab)?.label.toLowerCase()}{" "}
                            items are available for this topic.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicTabs;
