import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function groupVocabularyByCategory(vocabulary: any[]) {
  const grouped = vocabulary.reduce(
    (acc, item) => {
      const category = item.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const entries = Object.entries(grouped) as [string, any[]][];
  return entries.map(([category, items]) => ({
    category,
    items,
    count: items.length,
  }));
}

// Additional utilities used by pages/components
export const extractMainTopic = (category: string): string => {
  if (!category) return "General";
  return String(category).split(":")[0].trim();
};

export const createTopicPath = (
  languageCode: string,
  topic: string
): string => {
  const slug = generateSlug(topic);
  return `/workbook/${languageCode}/${slug}`;
};

export const decodeTopicSlug = (
  slug: string,
  available: string[]
): string | null => {
  if (!slug) return null;
  const normalized = slug.replace(/-/g, " ").toLowerCase();
  const match = available.find(
    (t) => generateSlug(t) === slug || t.toLowerCase() === normalized
  );
  return match || null;
};

export const getContentType = (category: string): "vocabulary" | "phrases" => {
  const main = extractMainTopic(category).toLowerCase();
  if (main.includes("phrase")) return "phrases";
  return "vocabulary";
};

// YouTube thumbnail utilities
export const getYouTubeThumbnailUrl = (
  youtubeId: string,
  quality: "default" | "medium" | "high" | "standard" | "maxres" = "medium"
): string => {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    standard: "sddefault",
    maxres: "maxresdefault",
  };

  return `https://img.youtube.com/vi/${youtubeId}/${qualityMap[quality]}.jpg`;
};

// Duration formatting utilities
export const formatDuration = (durationSec: number): string => {
  if (!durationSec || durationSec <= 0) return "0:00";

  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const seconds = Math.floor(durationSec % 60);

  if (hours >= 1) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
};
