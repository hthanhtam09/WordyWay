export interface ILanguage {
  _id: string;
  name: string;
  code: string;
  flag: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVocabulary {
  _id: string;
  word: string;
  translation: string;
  pronunciation: string;
  languageCode: string;
  category: string;
  example: string;
  exampleTranslation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
