import { connectMongoDB } from "@/lib/mongoose";
import { ListenTypeTopic } from "@/models/ListenTypeTopic";
import SegmentNavigator from "@/components/listen-type/SegmentNavigator";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectMongoDB();
  const topic = await ListenTypeTopic.findOne({ slug }).lean();

  if (!topic) {
    notFound();
  }

  // Convert segments to plain objects to avoid serialization issues
  const plainSegments = (topic as any).segments.map((seg: any) => ({
    order: seg.order,
    text: seg.text,
    audioUrl: seg.cloudinaryUrl || seg.audioUrl, // Prefer Cloudinary URL
    cloudinaryUrl: seg.cloudinaryUrl,
    cloudinaryPublicId: seg.cloudinaryPublicId,
    startMs: seg.startMs,
    endMs: seg.endMs,
  }));

  return (
    <SegmentNavigator
      segments={plainSegments}
      audioFileId={(topic as any).audioFileId}
      title={slug} // Use slug as title since we removed title field
      fullTranscript={(topic as any).fullTranscript}
      slug={slug}
    />
  );
}
