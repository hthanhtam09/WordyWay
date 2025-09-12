import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { ListenTypeTopic } from "@/models/ListenTypeTopic";

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Find the topic by slug
    const topic = await ListenTypeTopic.findOne({ slug }).lean();

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Type assertion to fix TypeScript issues
    const typedTopic = topic as any;

    // Format audio segments for the frontend
    const audioSegments = typedTopic.segments.map((segment: any) => ({
      order: segment.order,
      text: segment.text,
      audioUrl: segment.cloudinaryUrl || segment.audioUrl, // Prefer Cloudinary URL
      cloudinaryUrl: segment.cloudinaryUrl,
      cloudinaryPublicId: segment.cloudinaryPublicId,
      audioFileId: typedTopic.audioFileId, // Use the main audio file ID for GridFS (legacy)
      cloudinaryMainUrl: typedTopic.cloudinaryUrl, // Main Cloudinary URL
      cloudinaryMainPublicId: typedTopic.cloudinaryPublicId, // Main Cloudinary public ID
      startMs: segment.startMs || 0,
      endMs: segment.endMs || 0,
      duration:
        segment.endMs && segment.startMs
          ? segment.endMs - segment.startMs
          : segment.endMs || 0,
    }));

    // Calculate total duration from segments
    const totalDuration = audioSegments.reduce(
      (total: number, segment: any) => {
        return total + segment.duration;
      },
      0
    );

    return NextResponse.json({
      audioSegments,
      totalDuration,
      slug: typedTopic.slug,
      fullTranscript: typedTopic.fullTranscript,
    });
  } catch (error) {
    console.error("Error fetching concatenated audio:", error);
    return NextResponse.json(
      { error: "Failed to fetch concatenated audio" },
      { status: 500 }
    );
  }
}
