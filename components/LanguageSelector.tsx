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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">
        Select Language
      </h2>

      <div className="relative">
        <button
          onClick={toggleDropdown}
          onKeyDown={(e) => e.key === "Enter" && toggleDropdown()}
          className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label="Select language"
        >
          <div className="flex items-center space-x-3">
            {selectedLanguage && (
              <>
                <span className="text-2xl">{selectedLanguage.flag}</span>
                <span className="font-medium text-gray-900">
                  {selectedLanguage.name}
                </span>
              </>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
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
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {languages.map((language) => (
              <div
                key={language._id}
                onClick={() => handleLanguageSelect(language)}
                onKeyDown={(e) => handleKeyDown(e, language)}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer focus:bg-gray-50 focus:outline-none"
                tabIndex={0}
                role="option"
                aria-selected={selectedLanguage?._id === language._id}
              >
                <span className="text-2xl">{language.flag}</span>
                <span className="font-medium text-gray-900">
                  {language.name}
                </span>
                {selectedLanguage?._id === language._id && (
                  <svg
                    className="w-5 h-5 text-blue-600 ml-auto"
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
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{selectedLanguage.flag}</span>
            <div>
              <h3 className="font-semibold text-blue-900">
                {selectedLanguage.name} Selected
              </h3>
              <p className="text-sm text-blue-700">
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
