/**
 * Utility functions for URL slug generation and management
 */

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
