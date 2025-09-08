"use client";
import { useRef, useMemo, useState, use } from "react";
import { useVideoDetail } from "@/hooks/useVideoDetail";
import { useLanguages } from "@/hooks/useLanguages";
import YouTubePlayer from "@/components/youtube/YouTubePlayer";
import TranscriptPanel from "@/components/transcript/TranscriptPanel";
import { parseTranscript } from "@/lib/transcript";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { video, transcriptText } = useVideoDetail(resolvedParams.id);
  const { data: languages } = useLanguages();
  const playerRef = useRef<unknown>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);

  const getLanguageInfo = (code: string) => {
    return languages?.find((lang) => lang.code === code);
  };

  const parse = useMemo(() => {
    if (!transcriptText.data) return () => [];
    return (t: string) => {
      return parseTranscript(resolvedParams.id, t, duration || undefined);
    };
  }, [transcriptText.data, duration, resolvedParams.id]);

  if (video.isLoading || transcriptText.isLoading) {
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
    <div className="text-muted-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{video.data.name}</h1>
            <span className="text-lg">
              {getLanguageInfo(video.data.language)?.flag}
            </span>
            <span className="text-sm text-neutral-400">
              {getLanguageInfo(video.data.language)?.name}
            </span>
          </div>
          <p className="text-neutral-400">
            Duration:{" "}
            {duration
              ? `${Math.floor(duration / 60)}:${(duration % 60)
                  .toString()
                  .padStart(2, "0")}`
              : "Loading..."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <div className="lg:col-span-3 h-[420px]">
            <YouTubePlayer
              videoId={video.data.youtubeId}
              playerRef={playerRef}
              onReady={(p) => {
                const d = (p as any)?.getDuration?.();
                if (typeof d === "number" && d > 0) setDuration(Math.floor(d));
              }}
              onTime={(t) => setCurrentTime(t)}
            />
          </div>

          <div className="lg:col-span-2 h-[420px]">
            {transcriptText.data ? (
              <TranscriptPanel
                rawTranscript={transcriptText.data}
                playerRef={playerRef}
                durationSec={duration}
                parse={parse}
                currentTime={currentTime}
                title="Transcript"
              />
            ) : (
              <Card className="p-6 text-center text-neutral-500">
                No transcript available for this video.
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
