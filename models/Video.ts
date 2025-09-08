import { Schema, model, Document, models } from "mongoose";

export interface IVideo extends Document {
  _id: string;
  name: string;
  slug: string;
  url: string;
  youtubeId: string;
  language: string;
  durationSec?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITranscriptSegment extends Document {
  _id: string;
  videoId: string;
  order: number;
  startSec: number;
  endSec?: number;
  text: string;
}

const VideoSchema = new Schema<IVideo>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    url: { type: String, required: true },
    youtubeId: { type: String, required: true, index: true },
    language: { type: String, required: true, index: true },
    durationSec: { type: Number },
  },
  {
    timestamps: true,
  }
);

const TranscriptSegmentSchema = new Schema<ITranscriptSegment>(
  {
    videoId: { type: String, required: true, index: true },
    order: { type: Number, required: true },
    startSec: { type: Number, required: true },
    endSec: { type: Number },
    text: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for videoId and order
TranscriptSegmentSchema.index({ videoId: 1, order: 1 });

export const Video = models.Video || model<IVideo>("Video", VideoSchema);
export const TranscriptSegment =
  models.TranscriptSegment ||
  model<ITranscriptSegment>("TranscriptSegment", TranscriptSegmentSchema);
