"use client";

import { useState, useEffect } from "react";
import { ILanguage, IVocabulary } from "@/types";

interface VocabularyListProps {
  vocabulary: IVocabulary[];
  language: ILanguage;
  onVocabularyUpdate?: () => void;
}

const VocabularyList = ({ vocabulary, language }: VocabularyListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingExampleId, setPlayingExampleId] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Check if speech synthesis is supported and load voices
  useEffect(() => {
    const checkSpeechSupport = () => {
      const supported =
        "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
      setIsSpeechSupported(supported);

      if (supported) {
        // Load voices immediately if available
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setVoicesLoaded(true);
        } else {
          // Wait for voices to load
          window.speechSynthesis.onvoiceschanged = () => {
            setVoicesLoaded(true);
          };
        }
      }
    };

    checkSpeechSupport();
  }, []);

  // Filter vocabulary based on search term and category
  const filteredVocabulary = vocabulary.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.example &&
        item.example.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.exampleTranslation &&
        item.exampleTranslation
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Handle pronunciation using Web Speech API
  const handlePronunciation = async (vocab: IVocabulary) => {
    if (playingId === vocab._id || !isSpeechSupported || !voicesLoaded) {
      if (!voicesLoaded) {
        alert("Voices are still loading. Please wait a moment and try again.");
      }
      return;
    }

    setPlayingId(vocab._id);

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new window.SpeechSynthesisUtterance(vocab.word);

      const languageMap: { [key: string]: string } = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        it: "it-IT",
        pt: "pt-BR",
        ru: "ru-RU",
        ja: "ja-JP",
        ko: "ko-KR",
        zh: "zh-CN",
        ar: "ar-SA",
        hi: "hi-IN",
        vi: "vi-VN", // Vietnamese support
      };

      utterance.lang = languageMap[language.code.toLowerCase()] || "en-US";
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log(`Started speaking: ${vocab.word}`);
      };

      utterance.onend = () => {
        console.log(`Finished speaking: ${vocab.word}`);
        setPlayingId(null);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setPlayingId(null);
      };

      // Get available voices and set the best one for the language
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((voice) =>
        voice.lang.startsWith(language.code.toLowerCase())
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(
          `Using voice: ${preferredVoice.name} for language: ${preferredVoice.lang}`
        );
      } else {
        console.log("No preferred voice found, using default");
      }

      // Ensure speech synthesis is ready
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error playing pronunciation:", error);
      setPlayingId(null);
      alert("Failed to play pronunciation. Please try again.");
    }
  };

  // Handle example pronunciation using Web Speech API
  const handleExamplePronunciation = async (vocab: IVocabulary) => {
    if (playingExampleId === vocab._id || !isSpeechSupported || !voicesLoaded) {
      if (!voicesLoaded) {
        alert("Voices are still loading. Please wait a moment and try again.");
      }
      return;
    }

    setPlayingExampleId(vocab._id);

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new window.SpeechSynthesisUtterance(vocab.example);

      const languageMap: { [key: string]: string } = {
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        it: "it-IT",
        pt: "pt-BR",
        ru: "ru-RU",
        ja: "ja-JP",
        ko: "ko-KR",
        zh: "zh-CN",
        ar: "ar-SA",
        hi: "hi-IN",
        vi: "vi-VN", // Vietnamese support
      };

      utterance.lang = languageMap[language.code.toLowerCase()] || "en-US";
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log(`Started speaking example: ${vocab.example}`);
      };

      utterance.onend = () => {
        console.log(`Finished speaking example: ${vocab.example}`);
        setPlayingExampleId(null);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setPlayingExampleId(null);
      };

      // Get available voices and set the best one for the language
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find((voice) =>
        voice.lang.startsWith(language.code.toLowerCase())
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(
          `Using voice: ${preferredVoice.name} for language: ${preferredVoice.lang}`
        );
      } else {
        console.log("No preferred voice found, using default");
      }

      // Ensure speech synthesis is ready
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error playing example pronunciation:", error);
      setPlayingExampleId(null);
      alert("Failed to play example pronunciation. Please try again.");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, vocab: IVocabulary) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePronunciation(vocab);
    }
  };

  const handleExampleKeyDown = (
    event: React.KeyboardEvent,
    vocab: IVocabulary
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleExamplePronunciation(vocab);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          {!isSpeechSupported && (
            <p className="text-sm text-orange-600 mt-1">
              ⚠️ Audio pronunciation may not work in your browser
            </p>
          )}
          {isSpeechSupported && !voicesLoaded && (
            <p className="text-sm text-blue-600 mt-1">
              🔄 Loading audio voices...
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search words, translations, examples, or example translations..."
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vocabulary List */}
      <div className="space-y-4">
        {filteredVocabulary.length === 0 ? (
          <p className="text-gray-500">
            No vocabulary found matching your criteria.
          </p>
        ) : (
          filteredVocabulary.map((item) => (
            <div
              key={item._id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.word}
                      </h3>
                      <p className="text-gray-600 mb-1">{item.translation}</p>
                      <p className="text-gray-600 mb-2">{item.pronunciation}</p>
                    </div>
                    <button
                      onClick={() => handlePronunciation(item)}
                      onKeyDown={(e) => handleKeyDown(e, item)}
                      disabled={
                        playingId === item._id ||
                        !isSpeechSupported ||
                        !voicesLoaded
                      }
                      className="flex-shrink-0 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={`Play pronunciation for ${item.word}`}
                      tabIndex={0}
                    >
                      {playingId === item._id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {item.example && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                              Example
                            </span>
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          </div>
                          <p className="text-gray-800 font-medium">
                            &ldquo;{item.example}&rdquo;
                          </p>
                        </div>
                        <button
                          onClick={() => handleExamplePronunciation(item)}
                          onKeyDown={(e) => handleExampleKeyDown(e, item)}
                          disabled={
                            playingExampleId === item._id ||
                            !isSpeechSupported ||
                            !voicesLoaded
                          }
                          className="flex-shrink-0 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ml-3"
                          aria-label={`Play pronunciation for example: ${item.example}`}
                          tabIndex={0}
                        >
                          {playingExampleId === item._id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {item.exampleTranslation && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-lg mb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                              Translation
                            </span>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          </div>
                          <p className="text-gray-800 font-medium">
                            &ldquo;{item.exampleTranslation}&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-4 flex items-center space-x-3"></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VocabularyList;
