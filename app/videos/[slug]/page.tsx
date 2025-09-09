"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useVideoDetail } from "@/hooks/useVideoDetail";
import FullscreenVideoPlayer from "@/components/youtube/FullscreenVideoPlayer";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { video, transcriptSegments } = useVideoDetail(resolvedParams.slug);

  const handleBack = () => {
    router.push("/videos");
  };

  if (video.isLoading || transcriptSegments.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="w-full aspect-video mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-6" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      </div>
    );
  }
  if (video.isError || !video.data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Video Not Found
            </h1>
            <p className="text-neutral-400">
              The video you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FullscreenVideoPlayer
      videoId={video.data.youtubeId}
      videoTitle={video.data.name}
      segments={transcriptSegments.data || []}
      slug={resolvedParams.slug}
      onBack={handleBack}
    />
  );
}
