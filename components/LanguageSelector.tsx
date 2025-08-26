"use client";

import { useState } from "react";
import { ILanguage } from "@/types";

interface LanguageSelectorProps {
  languages: ILanguage[];
  selectedLanguage: ILanguage | null;
  onLanguageChange: (language: ILanguage) => void;
}

const LanguageSelector = ({
  languages,
  selectedLanguage,
  onLanguageChange,
}: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = (language: ILanguage) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent, language: ILanguage) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleLanguageSelect(language);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <h2 className="text-lg font-semibold mb-4 text-card-foreground">
        Select Language
      </h2>

      <div className="relative">
        <button
          onClick={toggleDropdown}
          onKeyDown={(e) => e.key === "Enter" && toggleDropdown()}
          className="w-full flex items-center justify-between px-4 py-3 text-left bg-secondary border border-input rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Select language"
        >
          <div className="flex items-center space-x-3">
            {selectedLanguage && (
              <>
                <span className="text-2xl">{selectedLanguage.flag}</span>
                <span className="font-medium text-card-foreground">
                  {selectedLanguage.name}
                </span>
              </>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
            {languages.map((language) => (
              <div
                key={language._id}
                onClick={() => handleLanguageSelect(language)}
                onKeyDown={(e) => handleKeyDown(e, language)}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-accent cursor-pointer focus:bg-accent focus:outline-none"
                tabIndex={0}
                role="option"
                aria-selected={selectedLanguage?._id === language._id}
              >
                <span className="text-2xl">{language.flag}</span>
                <span className="font-medium text-popover-foreground">
                  {language.name}
                </span>
                {selectedLanguage?._id === language._id && (
                  <svg
                    className="w-5 h-5 text-primary ml-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLanguage && (
        <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{selectedLanguage.flag}</span>
            <div>
              <h3 className="font-semibold text-primary">
                {selectedLanguage.name} Selected
              </h3>
              <p className="text-sm text-primary/80">
                Ready to start learning? Click the button below to begin your
                journey.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
