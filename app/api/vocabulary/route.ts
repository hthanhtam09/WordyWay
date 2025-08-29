import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";
import {
  CACHE_TAGS,
  CACHE_DURATIONS,
  generateCacheKey,
  getCacheHeaders,
} from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const languageCode = searchParams.get("languageCode");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "1000");

    // Generate cache key for this specific query
    const cacheKey = generateCacheKey.vocabulary(
      languageCode || undefined,
      category || undefined,
      limit
    );

    // Use cached function with specific parameters
    const vocabulary = await unstable_cache(
      async () => {
        try {
          await connectToDatabase();

          const filter: {
            isActive: boolean;
            languageCode?: string;
            category?: string;
          } = { isActive: true };

          if (languageCode) filter.languageCode = languageCode;
          if (category) filter.category = category;

          return await Vocabulary.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit);
        } catch (error) {
          console.error("Database connection error:", error);
          throw new Error("Database connection failed");
        }
      },
      [cacheKey],
      {
        tags: [
          CACHE_TAGS.VOCABULARY,
          languageCode
            ? `${CACHE_TAGS.VOCABULARY_BY_LANGUAGE}-${languageCode}`
            : "",
          category ? `${CACHE_TAGS.VOCABULARY_BY_CATEGORY}-${category}` : "",
        ].filter(Boolean),
        revalidate: CACHE_DURATIONS.VOCABULARY,
      }
    )();

    if (!vocabulary || vocabulary.length === 0) {
      return NextResponse.json(
        { error: "No vocabulary found" },
        {
          status: 404,
          headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
        }
      );
    }

    return NextResponse.json(vocabulary, {
      headers: getCacheHeaders(CACHE_DURATIONS.VOCABULARY),
    });
  } catch (error) {
    console.error("Error fetching vocabulary:", error);

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
      { error: "Failed to fetch vocabulary" },
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

    const vocabulary = new Vocabulary(body);
    await vocabulary.save();

    // Invalidate relevant caches when new vocabulary is added
    revalidateTag(CACHE_TAGS.VOCABULARY);

    // Invalidate language-specific cache if languageCode is provided
    if (body.languageCode) {
      revalidateTag(
        `${CACHE_TAGS.VOCABULARY_BY_LANGUAGE}-${body.languageCode}`
      );
    }

    // Invalidate category-specific cache if category is provided
    if (body.category) {
      revalidateTag(`${CACHE_TAGS.VOCABULARY_BY_CATEGORY}-${body.category}`);
    }

    return NextResponse.json(vocabulary, {
      status: 201,
      headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
    });
  } catch (error) {
    console.error("Error creating vocabulary:", error);

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
      { error: "Failed to create vocabulary" },
      {
        status: 500,
        headers: getCacheHeaders(CACHE_DURATIONS.SHORT),
      }
    );
  }
}
