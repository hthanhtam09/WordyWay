"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useVideos(language?: string) {
    return useQuery({
        queryKey: ["videos", language],
        queryFn: async () => {
            const { videos } = await api.listVideos(language);
            return videos;
        },
    });
}
