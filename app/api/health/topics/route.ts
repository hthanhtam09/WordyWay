import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { ListenTypeTopic } from "@/models/ListenTypeTopic";

export async function GET() {
  await connectMongoDB();
  const topics = await ListenTypeTopic.find({}, { slug: 1, title: 1 })
    .sort({ title: 1 })
    .lean();
  return NextResponse.json({ topics });
}
