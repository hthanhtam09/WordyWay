import type { Video as VideoType, TranscriptSegment as SegmentType } from "@/lib/types";

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "";

async function baseFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`Fetch ${path} failed ${res.status}`);
    return res.json() as Promise<T>;
}

// Available languages
export const availableLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "it", name: "Italiano", flag: "🇮🇹" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
];

export const api = {
    listVideos: async (language?: string) => {
        const url = language ? `/api/videos?language=${language}` : "/api/videos";
        return baseFetch<{ videos: VideoType[] }>(url);
    },

    getVideo: async (id: string) => {
        return baseFetch<{ video: VideoType }>(`/api/videos/${id}`);
    },

    getTranscriptText: async (id: string) => {
        return baseFetch<{ transcript: string }>(`/api/videos/${id}/transcript`);
    },

    getLanguages: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { languages: availableLanguages };
    },
    // Fetch a single language by code from API route
    fetchLanguageByCode: async (languageCode: string) => {
        const res = await fetch(`/api/languages`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch languages");
        const languages = (await res.json()) as Array<{
            code: string;
            name: string;
            flag: string;
        }>;
        const found = languages.find(
            (l) => l.code.toLowerCase() === languageCode.toLowerCase()
        );
        if (!found) throw new Error("Language not found");
        return found;
    },
    // Fetch unique topics for a language by reading vocabulary categories
    fetchTopics: async (languageCode: string) => {
        const res = await fetch(
            `/api/vocabulary?languageCode=${encodeURIComponent(languageCode)}`,
            {
                cache: "no-store",
            }
        );
        if (res.status === 404) return [] as string[];
        if (!res.ok) throw new Error("Failed to fetch topics");
        const items = (await res.json()) as Array<{ category: string }>;
        const topics = Array.from(
            new Set(items.map((i) => i.category).filter(Boolean))
        );
        return topics;
    },
    // Fetch vocabulary filtered by language and category
    fetchVocabulary: async (languageCode: string, category?: string) => {
        const params = new URLSearchParams({ languageCode });
        if (category) params.set("category", category);
        const res = await fetch(`/api/vocabulary?${params.toString()}`, {
            cache: "no-store",
        });
        if (res.status === 404) return [] as Array<{ category: string }>;
        if (!res.ok) throw new Error("Failed to fetch vocabulary");
        return (await res.json()) as Array<{ category: string }>;
    },
};
