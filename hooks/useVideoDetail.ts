"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useVideoDetail(id: string) {
    const video = useQuery({
        queryKey: ["video", id],
        queryFn: async () => (await api.getVideo(id)).video,
        enabled: !!id,
    });

    const transcriptText = useQuery({
        queryKey: ["transcript-text", id],
        queryFn: async () => (await api.getTranscriptText(id)).transcript,
        enabled: !!id,
    });

    return { video, transcriptText };
}
