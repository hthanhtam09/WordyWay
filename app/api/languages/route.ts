import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import Language from "@/models/Language";
import {
  CACHE_TAGS,
  CACHE_DURATIONS,
  generateCacheKey,
  getCacheHeaders,
} from "@/lib/cache";

// Cached function to fetch languages
const getCachedLanguages = unstable_cache(
  async () => {
    try {
      await connectToDatabase();
      return await Language.find({ isActive: true }).sort({ name: 1 });
    } catch (error) {
      console.error("Database connection error:", error);
      throw new Error("Database connection failed");
    }
  },
  [generateCacheKey.languages()],
  {
    tags: [CACHE_TAGS.LANGUAGES],
    revalidate: CACHE_DURATIONS.LANGUAGES,
  }
);

export async function GET() {
  try {
    const languages = await getCachedLanguages();

    if (!languages || languages.length === 0) {
      return NextResponse.json(
        { error: "No languages available" },
        {
          status: 404,
          headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
        }
      );
    }

    return NextResponse.json(languages, {
      headers: getCacheHeaders(CACHE_DURATIONS.LANGUAGES),
    });
  } catch (error) {
    console.error("Error fetching languages:", error);

    // Check if it's a database connection error
    if (
      error instanceof Error &&
      error.message === "Database connection failed"
    ) {
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        {
          status: 503,
          headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
        }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch languages" },
      {
        status: 500,
        headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const language = new Language(body);
    await language.save();

    // Invalidate languages cache when new language is added
    revalidateTag(CACHE_TAGS.LANGUAGES);

    return NextResponse.json(language, {
      status: 201,
      headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
    });
  } catch (error) {
    console.error("Error creating language:", error);

    // Check if it's a database connection error
    if (
      error instanceof Error &&
      error.message.includes("Database connection failed")
    ) {
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        {
          status: 503,
          headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
        }
      );
    }

    return NextResponse.json(
      { error: "Failed to create language" },
      {
        status: 500,
        headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
      }
    );
  }
}
