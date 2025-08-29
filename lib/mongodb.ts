import mongoose from "mongoose";
import { config } from "dotenv";
import path from "path";

// Load environment variables if not already loaded
if (!process.env.MONGODB_URI) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI;

// Don't throw error during build time, only at runtime
if (!MONGODB_URI && typeof window === "undefined") {
  console.warn(
    "MONGODB_URI environment variable is not set. Database operations will fail at runtime."
  );
}

interface Cached {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: Cached = (global as { mongoose?: Cached }).mongoose || {
  conn: null,
  promise: null,
};

if (!cached) {
  cached = (global as { mongoose?: Cached }).mongoose = {
    conn: null,
    promise: null,
  };
}

export const connectToDatabase = async () => {
  // Check if we're in a build environment
  if (process.env.NODE_ENV === "production" && !MONGODB_URI) {
    throw new Error(
      "MONGODB_URI environment variable is required in production"
    );
  }

  // Check if we're building (Vercel build process)
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "production"
  ) {
    if (!MONGODB_URI) {
      throw new Error(
        "MONGODB_URI environment variable is required for Vercel deployment"
      );
    }
  }

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectToDatabase;
