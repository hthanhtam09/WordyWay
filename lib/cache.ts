import { unstable_cache } from "next/cache";

// Cache configuration constants
export const CACHE_TAGS = {
    LANGUAGES: "languages",
    VOCABULARY: "vocabulary",
    VOCABULARY_BY_LANGUAGE: "vocabulary-by-language",
    VOCABULARY_BY_CATEGORY: "vocabulary-by-category",
} as const;

export const CACHE_DURATIONS = {
    LANGUAGES: 3600, // 1 hour - languages don't change often
    VOCABULARY: 1800, // 30 minutes - vocabulary changes more frequently
    SHORT: 300, // 5 minutes - for frequently changing data
} as const;

// Cache key generators
export const generateCacheKey = {
    languages: () => "languages",
    vocabulary: (languageCode?: string, category?: string, limit?: number) =>
        `vocabulary-${languageCode || "all"}-${category || "all"}-${limit || 50}`,
    vocabularyByLanguage: (languageCode: string) =>
        `vocabulary-lang-${languageCode}`,
    vocabularyByCategory: (category: string) => `vocabulary-cat-${category}`,
};

// Cache invalidation helpers
export const invalidateCache = {
    languages: () => {
        // This will be handled by revalidateTag in the API routes
        return CACHE_TAGS.LANGUAGES;
    },
    vocabulary: () => {
        return CACHE_TAGS.VOCABULARY;
    },
    vocabularyByLanguage: (languageCode: string) => {
        return `${CACHE_TAGS.VOCABULARY_BY_LANGUAGE}-${languageCode}`;
    },
    vocabularyByCategory: (category: string) => {
        return `${CACHE_TAGS.VOCABULARY_BY_CATEGORY}-${category}`;
    },
};

// Cached function wrappers
export const createCachedFunction = <T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    keyGenerator: (...args: T) => string,
    tags: string[],
    revalidate: number = CACHE_DURATIONS.SHORT
) => {
    return unstable_cache(fn, [keyGenerator as unknown as string], {
        tags,
        revalidate,
    });
};

// Cache headers for responses
export const getCacheHeaders = (
    revalidate: number = CACHE_DURATIONS.SHORT
) => ({
    "Cache-Control": `public, s-maxage=${revalidate}, stale-while-revalidate=${revalidate * 2
        }`,
    "CDN-Cache-Control": `max-age=${revalidate}`,
    "Vercel-CDN-Cache-Control": `max-age=${revalidate}`,
});
