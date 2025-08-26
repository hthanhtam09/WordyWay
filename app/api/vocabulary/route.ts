import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Vocabulary from "@/models/Vocabulary";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const languageCode = searchParams.get("languageCode");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "50");

    const filter: {
      isActive: boolean;
      languageCode?: string;
      category?: string;
      difficulty?: string;
    } = { isActive: true };
    if (languageCode) filter.languageCode = languageCode;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const vocabulary = await Vocabulary.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(vocabulary);
  } catch (error) {
    console.error("Error fetching vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabulary" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const vocabulary = new Vocabulary(body);
    await vocabulary.save();

    return NextResponse.json(vocabulary, { status: 201 });
  } catch (error) {
    console.error("Error creating vocabulary:", error);
    return NextResponse.json(
      { error: "Failed to create vocabulary" },
      { status: 500 }
    );
  }
}
