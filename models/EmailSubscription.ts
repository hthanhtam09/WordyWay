import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmailSubscription extends Document {
  email: string;
  createdAt: Date;
}

const EmailSubscriptionSchema = new Schema<IEmailSubscription>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /[^@\s]+@[^@\s]+\.[^@\s]+/,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const EmailSubscription: Model<IEmailSubscription> =
  mongoose.models.EmailSubscription ||
  mongoose.model<IEmailSubscription>(
    "EmailSubscription",
    EmailSubscriptionSchema
  );

export default EmailSubscription;
