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

    // Get raw transcript (order = -1)
    const rawSegment = (await TranscriptSegment.findOne({
      videoId,
      order: -1,
    }).lean()) as Record<string, any> | null;

    if (!rawSegment) {
      return NextResponse.json(
        { error: "Transcript not found" },
        { status: 404 }
      );
    }

    // Normalize: strip any __RAW__ marker, BOM/CRLF, leading spaces
    const transcript = String((rawSegment?.text as string | undefined) ?? "")
      .replace(/\uFEFF/g, "")
      .replace(/\r/g, "")
      .replace(/__RAW__\s*/gi, "")
      .trim();

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
