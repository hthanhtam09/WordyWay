import mongoose, { Schema, Document } from "mongoose";

export interface IListenTypeSegment {
    order: number;
    text: string;
    audioUrl?: string; // Each segment can have its own audio
    cloudinaryUrl?: string; // Cloudinary URL for the segment
    cloudinaryPublicId?: string; // Cloudinary public ID for the segment
    startMs?: number | null;
    endMs?: number | null;
}

export interface IListenTypeTopic extends Document {
    slug: string;
    audioFileId?: string; // GridFS file ID (legacy)
    cloudinaryUrl?: string; // Cloudinary URL for the main audio file
    cloudinaryPublicId?: string; // Cloudinary public ID for the main audio file
    fullTranscript?: string; // Full conversation transcript
    segments: IListenTypeSegment[];
    createdAt?: Date;
    updatedAt?: Date;
}

const ListenTypeSegmentSchema = new Schema<IListenTypeSegment>({
    order: { type: Number, required: true },
    text: { type: String, required: true },
    audioUrl: { type: String }, // Each segment can have its own audio
    cloudinaryUrl: { type: String }, // Cloudinary URL for the segment
    cloudinaryPublicId: { type: String }, // Cloudinary public ID for the segment
    startMs: { type: Number, default: null },
    endMs: { type: Number, default: null },
});

const ListenTypeTopicSchema = new Schema<IListenTypeTopic>(
    {
        slug: { type: String, required: true, unique: true },
        audioFileId: { type: String }, // GridFS file ID (legacy)
        cloudinaryUrl: { type: String }, // Cloudinary URL for the main audio file
        cloudinaryPublicId: { type: String }, // Cloudinary public ID for the main audio file
        fullTranscript: { type: String }, // Full conversation transcript
        segments: [ListenTypeSegmentSchema],
    },
    {
        timestamps: true,
    }
);

export const ListenTypeTopic =
    mongoose.models.ListenTypeTopic ||
    mongoose.model<IListenTypeTopic>("ListenTypeTopic", ListenTypeTopicSchema);
