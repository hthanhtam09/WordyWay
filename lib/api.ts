import { ILanguage, IVocabulary } from "@/types";

export const api = {
  async fetchLanguages(): Promise<ILanguage[]> {
    const response = await fetch("/api/languages");
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("No languages available");
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch language data");
    }
    return response.json();
  },

  async fetchLanguageByCode(languageCode: string): Promise<ILanguage> {
    const languages = await this.fetchLanguages();
    const foundLanguage = languages.find(
      (lang: ILanguage) => lang.code === languageCode
    );
    if (!foundLanguage) {
      throw new Error("Language not found");
    }
    return foundLanguage;
  },

  async fetchTopics(languageCode: string): Promise<string[]> {
    const response = await fetch(
      `/api/vocabulary?languageCode=${languageCode}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array for 404, not an error
        return [];
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch topics");
    }
    const data = (await response.json()) as IVocabulary[];
    const topics = [...new Set(data.map((item: IVocabulary) => item.category))];
    return topics;
  },

  async fetchVocabulary(
    languageCode: string,
    category: string
  ): Promise<IVocabulary[]> {
    const response = await fetch(
      `/api/vocabulary?languageCode=${languageCode}&category=${encodeURIComponent(
        category
      )}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array for 404, not an error
        return [];
      }
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch vocabulary");
    }
    return response.json();
  },
};
