import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { Video } from "@/models/Video";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectMongoDB();

    const { slug } = await params;

    const video = (await Video.findOne({ slug }).lean()) as Record<
      string,
      any
    > | null;
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const formattedVideo = {
      _id: String(video._id),
      name: String(video.name),
      slug: String(video.slug),
      url: String(video.url),
      youtubeId: String(video.youtubeId),
      language: String(video.language),
      durationSec:
        typeof video.durationSec === "number" ? video.durationSec : undefined,
      createdAt: video.createdAt as Date | undefined,
      updatedAt: video.updatedAt as Date | undefined,
    };

    return NextResponse.json({ video: formattedVideo });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}
