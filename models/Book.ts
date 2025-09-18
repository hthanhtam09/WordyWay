import { Schema, model, Document, models } from "mongoose";

export interface IBook extends Document {
  _id: string;
  name: string;
  slug: string;
  bookImageUrl: string;
  pdfUrl: string;
  description?: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    bookImageUrl: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    description: { type: String },
    language: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Book =
  models.FreeBook || model<IBook>("FreeBook", BookSchema, "freebooks");
