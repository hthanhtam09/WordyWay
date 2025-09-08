import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { Video } from "@/models/Video";

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");

    const filter = language ? { language } : {};

    const videos = (await Video.find(filter).lean()) as Array<
      Record<string, any>
    >;

    const formattedVideos = videos.map((video) => ({
      _id: String(video._id),
      name: String(video.name),
      url: String(video.url),
      youtubeId: String(video.youtubeId),
      language: String(video.language),
      durationSec:
        typeof video.durationSec === "number" ? video.durationSec : undefined,
      createdAt: video.createdAt as Date | undefined,
      updatedAt: video.updatedAt as Date | undefined,
    }));

    return NextResponse.json({ videos: formattedVideos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    const details = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      { error: "Failed to fetch videos", details },
      { status: 500 }
    );
  }
}
