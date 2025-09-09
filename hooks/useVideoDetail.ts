"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useVideoDetail(slug: string) {
  const video = useQuery({
    queryKey: ["video", slug],
    queryFn: async () => (await api.getVideo(slug)).video,
    enabled: !!slug,
  });

  const transcriptText = useQuery({
    queryKey: ["transcript-text", slug],
    queryFn: async () => (await api.getTranscriptText(slug)).transcript,
    enabled: !!slug,
  });

  const transcriptSegments = useQuery({
    queryKey: ["transcript-segments", slug],
    queryFn: async () => (await api.getTranscriptSegments(slug)).segments,
    enabled: !!slug,
  });

  return { video, transcriptText, transcriptSegments };
}
