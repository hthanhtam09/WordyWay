import mongoose from "mongoose";

export interface IVocabulary {
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

const vocabularySchema = new mongoose.Schema<IVocabulary>(
    {
        word: {
            type: String,
            required: true,
        },
        translation: {
            type: String,
            required: true,
        },
        pronunciation: {
            type: String,
            required: true,
        },
        languageCode: {
            type: String,
            required: true,
            ref: "Language",
        },
        category: {
            type: String,
            required: true,
        },
        example: {
            type: String,
            default: "",
        },
        exampleTranslation: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for better query performance
vocabularySchema.index({ languageCode: 1, category: 1 });
vocabularySchema.index({ word: 1, languageCode: 1 });

export default mongoose.models.Vocabulary ||
    mongoose.model<IVocabulary>("Vocabulary", vocabularySchema);
