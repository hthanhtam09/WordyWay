import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { ListenTypeTopic } from "@/models/ListenTypeTopic";

export async function GET() {
  await connectMongoDB();
  const topics = await ListenTypeTopic.find(
    {},
    {
      slug: 1,
      segments: 1,
      fullTranscript: 1,
      cloudinaryUrl: 1,
      cloudinaryPublicId: 1,
    }
  )
    .sort({ slug: 1 })
    .lean();
  return NextResponse.json(topics);
}
