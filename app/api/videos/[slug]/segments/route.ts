import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { Video, TranscriptSegment } from "@/models/Video";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectMongoDB();

    const { slug } = await params;

    // First find the video by slug to get its _id
    const video = await Video.findOne({ slug }).lean();
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const videoId = String((video as any)._id);

    // Get all transcript segments (excluding raw segment with order = -1)
    const segments = await TranscriptSegment.find({
      videoId,
      order: { $gte: 0 },
    })
      .sort({ order: 1 })
      .lean();

    // Format segments for API response
    const formattedSegments = segments.map((segment) => ({
      _id: String(segment._id),
      videoId: String(segment.videoId),
      order: segment.order,
      startSec: segment.startSec,
      endSec: segment.endSec,
      text: segment.text,
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
    }));

    return NextResponse.json({ segments: formattedSegments });
  } catch (error) {
    console.error("Error fetching transcript segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript segments" },
      { status: 500 }
    );
  }
}
