import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { ListenTypeTopic } from "@/models/ListenTypeTopic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    await connectMongoDB();
    const { fileId } = await params;

    // Try to find the topic by Cloudinary public ID first
    let topic = await ListenTypeTopic.findOne({
      cloudinaryPublicId: fileId,
    }).lean();

    // If not found, try to find by GridFS file ID (legacy)
    if (!topic) {
      topic = await ListenTypeTopic.findOne({
        audioFileId: fileId,
      }).lean();
    }

    if (!topic) {
      console.error("Topic not found for fileId:", fileId);
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Type assertion to fix TypeScript issues
    const typedTopic = topic as any;

    // Return Cloudinary URL if available
    if (typedTopic.cloudinaryUrl) {
      return NextResponse.json({
        url: typedTopic.cloudinaryUrl,
        publicId: typedTopic.cloudinaryPublicId,
        type: "cloudinary",
      });
    }

    // Fallback to GridFS (legacy)
    if (typedTopic.audioFileId) {
      return NextResponse.json({
        fileId: typedTopic.audioFileId,
        type: "gridfs",
        message: "Using legacy GridFS. Consider migrating to Cloudinary.",
      });
    }

    return NextResponse.json({ error: "No audio file found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching audio URL:", error);
    return NextResponse.json(
      { error: "Failed to fetch audio URL" },
      { status: 500 }
    );
  }
}

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

    // Format audio segments with Cloudinary URLs
    const audioSegments = typedTopic.segments.map((segment: any) => ({
      order: segment.order,
      text: segment.text,
      audioUrl: segment.cloudinaryUrl || segment.audioUrl,
      cloudinaryUrl: segment.cloudinaryUrl,
      cloudinaryPublicId: segment.cloudinaryPublicId,
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
      mainAudioUrl: typedTopic.cloudinaryUrl,
      mainAudioPublicId: typedTopic.cloudinaryPublicId,
      hasCloudinary: !!typedTopic.cloudinaryUrl,
    });
  } catch (error) {
    console.error("Error fetching Cloudinary audio data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Cloudinary audio data" },
      { status: 500 }
    );
  }
}
