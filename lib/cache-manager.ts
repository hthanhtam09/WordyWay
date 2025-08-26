import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "./cache";

/**
 * Cache Manager - Utility for manual cache operations
 */
export class CacheManager {
  /**
   * Invalidate all language-related caches
   */
  static invalidateLanguages() {
    revalidateTag(CACHE_TAGS.LANGUAGES);
  }

  /**
   * Invalidate all vocabulary-related caches
   */
  static invalidateAllVocabulary() {
    revalidateTag(CACHE_TAGS.VOCABULARY);
  }

  /**
   * Invalidate vocabulary cache for a specific language
   */
  static invalidateVocabularyByLanguage(languageCode: string) {
    revalidateTag(`${CACHE_TAGS.VOCABULARY_BY_LANGUAGE}-${languageCode}`);
  }

  /**
   * Invalidate vocabulary cache for a specific category
   */
  static invalidateVocabularyByCategory(category: string) {
    revalidateTag(`${CACHE_TAGS.VOCABULARY_BY_CATEGORY}-${category}`);
  }

  /**
   * Invalidate all caches (use with caution)
   */
  static invalidateAll() {
    revalidateTag(CACHE_TAGS.LANGUAGES);
    revalidateTag(CACHE_TAGS.VOCABULARY);
  }

  /**
   * Revalidate a specific API path
   */
  static revalidateApiPath(path: string) {
    revalidatePath(path);
  }

  /**
   * Revalidate all API paths
   */
  static revalidateAllApiPaths() {
    revalidatePath("/api/languages");
    revalidatePath("/api/vocabulary");
  }
}

/**
 * Cache invalidation helper functions for common scenarios
 */
export const cacheInvalidation = {
  /**
   * When a new language is added
   */
  onLanguageAdded: () => {
    CacheManager.invalidateLanguages();
  },

  /**
   * When a language is updated
   */
  onLanguageUpdated: (languageCode?: string) => {
    CacheManager.invalidateLanguages();
    if (languageCode) {
      CacheManager.invalidateVocabularyByLanguage(languageCode);
    }
  },

  /**
   * When a language is deleted
   */
  onLanguageDeleted: (languageCode?: string) => {
    CacheManager.invalidateLanguages();
    if (languageCode) {
      CacheManager.invalidateVocabularyByLanguage(languageCode);
    }
  },

  /**
   * When new vocabulary is added
   */
  onVocabularyAdded: (languageCode?: string, category?: string) => {
    CacheManager.invalidateAllVocabulary();
    if (languageCode) {
      CacheManager.invalidateVocabularyByLanguage(languageCode);
    }
    if (category) {
      CacheManager.invalidateVocabularyByCategory(category);
    }
  },

  /**
   * When vocabulary is updated
   */
  onVocabularyUpdated: (languageCode?: string, category?: string) => {
    CacheManager.invalidateAllVocabulary();
    if (languageCode) {
      CacheManager.invalidateVocabularyByLanguage(languageCode);
    }
    if (category) {
      CacheManager.invalidateVocabularyByCategory(category);
    }
  },

  /**
   * When vocabulary is deleted
   */
  onVocabularyDeleted: (languageCode?: string, category?: string) => {
    CacheManager.invalidateAllVocabulary();
    if (languageCode) {
      CacheManager.invalidateVocabularyByLanguage(languageCode);
    }
    if (category) {
      CacheManager.invalidateVocabularyByCategory(category);
    }
  },
};
