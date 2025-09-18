import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import mongoose from "mongoose";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    console.log("🔍 API: Fetching books...");

    // Ensure connection
    if (mongoose.connections[0].readyState !== 1) {
      await connectMongoDB();
    }

    console.log("✅ API: Connected to MongoDB");

    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");

    let query = {};
    if (language) {
      query = { language };
    }

    console.log("🔍 API: Query:", query);

    // Try direct collection access
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }
    const collection = db.collection("freebooks");

    const directBooks = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Use direct collection results
    const books = directBooks.map((book) => ({
      _id: book._id.toString(),
      name: book.name,
      slug: book.slug,
      bookImageUrl: book.bookImageUrl,
      pdfUrl: book.pdfUrl,
      description: book.description,
      language: book.language,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
    }));

    console.log("✅ API: Returning", books.length, "books");
    return NextResponse.json(books);
  } catch (error) {
    console.error("❌ API Error fetching books:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch books",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
