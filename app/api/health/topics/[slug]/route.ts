import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { ListenTypeTopic } from "@/models/ListenTypeTopic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_: Request, { params }: Params) {
  await connectMongoDB();
  const { slug } = await params;
  const topic = await ListenTypeTopic.findOne({ slug }).lean();
  if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ topic });
}
