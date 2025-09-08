"use client";
import { useRef, useMemo, useState, use } from "react";
import { useVideoDetail } from "@/hooks/useVideoDetail";
import { useLanguages } from "@/hooks/useLanguages";
import YouTubePlayer from "@/components/youtube/YouTubePlayer";
import TranscriptPanel from "@/components/transcript/TranscriptPanel";
import { parseTranscript } from "@/lib/transcript";

export default function VideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { video, transcriptText } = useVideoDetail(resolvedParams.slug);
  const { data: languages } = useLanguages();
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);

  const getLanguageInfo = (code: string) => {
    return languages?.find((lang) => lang.code === code);
  };

  const parse = useMemo(() => {
    if (!transcriptText.data) return () => [];

    return (t: string) => {
      return parseTranscript(resolvedParams.slug, t, duration || undefined);
    };
  }, [transcriptText.data, duration, resolvedParams.slug]);

  const handlePlayerReady = (player: any) => {
    playerRef.current = player;
    const playerDuration = player.getDuration?.();
    if (typeof playerDuration === "number" && playerDuration > 0) {
      setDuration(Math.floor(playerDuration));
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  if (video.isLoading || transcriptText.isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-800 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <div className="aspect-video bg-neutral-800 rounded-2xl"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-[420px] bg-neutral-800 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video.data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Video Not Found
            </h1>
            <p className="text-neutral-400">
              The video you&#39;re looking for doesn&#39;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <YouTubePlayer
              videoId={video.data.youtubeId}
              onReady={handlePlayerReady}
              onTime={handleTimeUpdate}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Transcript</h2>
              <p className="text-sm text-neutral-400">
                Click on any segment to jump to that time in the video
              </p>
            </div>

            {transcriptText.data ? (
              <TranscriptPanel
                rawTranscript={transcriptText.data}
                playerRef={playerRef}
                durationSec={duration}
                parse={parse}
                currentTime={currentTime}
              />
            ) : (
              <div className="h-[420px] bg-neutral-900 rounded-2xl flex items-center justify-center">
                <div className="text-center text-neutral-500">
                  <p>No transcript available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
