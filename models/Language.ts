import mongoose from "mongoose";

export interface ILanguage {
    name: string;
    code: string;
    flag: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const languageSchema = new mongoose.Schema<ILanguage>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        flag: {
            type: String,
            required: true,
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

export default mongoose.models.Language ||
    mongoose.model<ILanguage>("Language", languageSchema);
