"use client";
import { useState } from "react";
import { useLanguages } from "@/hooks/useLanguages";
import { cn } from "@/lib/utils";

type Props = {
    selectedLanguage?: string;
    onLanguageChange: (language: string | undefined) => void;
    className?: string;
};

export default function LanguageSelector({
    selectedLanguage,
    onLanguageChange,
    className,
}: Props) {
    const { data: languages, isLoading } = useLanguages();
    const [isOpen, setIsOpen] = useState(false);

    const selectedLang = languages?.find(
        (lang) => lang.code === selectedLanguage
    );

    const handleLanguageSelect = (code: string) => {
        if (code === selectedLanguage) {
            onLanguageChange(undefined); // Deselect if same language clicked
        } else {
            onLanguageChange(code);
        }
        setIsOpen(false);
    };

    if (isLoading) {
        return (
            <div className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-muted-foreground bg-secondary cursor-not-allowed">
                <span className="animate-pulse">Loading languages...</span>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="relative w-full cursor-default rounded-md bg-secondary py-2 pl-3 pr-10 text-left text-foreground shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm border border-border"
            >
                <span className="flex items-center">
                    <span className="mr-2 text-lg">{selectedLang?.flag || "🌐"}</span>
                    <span className="block truncate">
                        {selectedLang?.name || "All Languages"}
                    </span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                        className="h-5 w-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    aria-label="Select language"
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-card py-1 text-base shadow-lg border border-border focus:outline-none sm:text-sm"
                >
                    {/* All Languages option */}
                    <div
                        role="option"
                        tabIndex={0}
                        aria-selected={!selectedLanguage}
                        onClick={() => handleLanguageSelect("")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") handleLanguageSelect("");
                        }}
                        className={cn(
                            "relative cursor-default select-none py-2 pl-10 pr-4",
                            !selectedLanguage
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <span className="flex items-center">
                            <span className="mr-2 text-lg">🌐</span>
                            All Languages
                        </span>
                        {!selectedLanguage && (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg
                                    className="h-5 w-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </span>
                        )}
                    </div>

                    {languages?.map((lang) => (
                        <div
                            key={lang.code}
                            role="option"
                            tabIndex={0}
                            aria-selected={selectedLanguage === lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                    handleLanguageSelect(lang.code);
                            }}
                            className={cn(
                                "relative cursor-default select-none py-2 pl-10 pr-4",
                                selectedLanguage === lang.code
                                    ? "bg-primary text-primary-foreground"
                                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <span className="flex items-center">
                                <span className="mr-2 text-lg">{lang.flag}</span>
                                {lang.name}
                            </span>
                            {selectedLanguage === lang.code && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg
                                        className="h-5 w-5"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
