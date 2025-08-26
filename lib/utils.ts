/**
 * Utility functions for URL slug generation and management
 */

/**
 * Extracts the main topic from a category string
 * @param category - The full category string (e.g., "La Famille - Family (Word Formation)")
 * @returns The main topic (e.g., "La Famille - Family")
 */
export const extractMainTopic = (category: string): string => {
  // Remove word formation and other subcategories
  return category
    .replace(/\s*\([^)]*\)/g, "") // Remove parentheses content
    .replace(/\s*-\s*Phrases.*$/i, "") // Remove phrases suffix
    .trim();
};

/**
 * Determines the content type from a category string
 * @param category - The full category string
 * @returns The content type: 'vocabulary', 'word-formation', 'phrases', etc.
 */
export const getContentType = (category: string): string => {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes("word formation")) {
    return "word-formation";
  }
  if (lowerCategory.includes("phrases")) {
    return "phrases";
  }
  if (lowerCategory.includes("nouns")) {
    return "nouns";
  }
  if (lowerCategory.includes("verbs")) {
    return "verbs";
  }

  return "vocabulary"; // default
};

/**
 * Converts a topic name to a clean, URL-friendly slug
 * @param topic - The topic name (e.g., "La Famille - Family")
 * @returns A clean slug (e.g., "la-famille-family")
 */
export const createTopicSlug = (topic: string): string => {
  return (
    topic
      .toLowerCase()
      .trim()
      // Replace spaces, hyphens, and other separators with single hyphens
      .replace(/[\s\-_]+/g, "-")
      // Remove special characters except letters, numbers, and hyphens
      .replace(/[^a-z0-9\-]/g, "")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, "")
  );
};

/**
 * Decodes a slug back to the original topic name
 * This is a simple reverse mapping - in a real app you might want to store this mapping in a database
 * @param slug - The URL slug (e.g., "la-famille-family")
 * @param availableTopics - Array of available topic names to match against
 * @returns The original topic name or the slug if no match found
 */
export const decodeTopicSlug = (
  slug: string,
  availableTopics: string[]
): string => {
  // Try to find an exact match first
  const exactMatch = availableTopics.find(
    (topic) => createTopicSlug(topic) === slug
  );
  if (exactMatch) {
    return exactMatch;
  }

  // If no exact match, return the slug (fallback)
  return slug;
};

/**
 * Groups vocabulary items by main topic
 * @param vocabulary - Array of vocabulary items
 * @returns Object with main topics as keys and grouped vocabulary as values
 */
export const groupVocabularyByTopic = (
  vocabulary: { category: string; [key: string]: unknown }[]
) => {
  const grouped: {
    [key: string]: {
      [contentType: string]: { category: string; [key: string]: unknown }[];
    };
  } = {};

  vocabulary.forEach((item) => {
    const mainTopic = extractMainTopic(item.category);
    const contentType = getContentType(item.category);

    if (!grouped[mainTopic]) {
      grouped[mainTopic] = {};
    }

    if (!grouped[mainTopic][contentType]) {
      grouped[mainTopic][contentType] = [];
    }

    grouped[mainTopic][contentType].push(item);
  });

  return grouped;
};

/**
 * Creates a URL-friendly path for a topic
 * @param languageCode - The language code
 * @param topic - The topic name
 * @returns A clean URL path
 */
export const createTopicPath = (
  languageCode: string,
  topic: string
): string => {
  const slug = createTopicSlug(topic);
  return `/workbook/${languageCode}/${slug}`;
};
