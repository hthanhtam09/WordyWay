import { useQuery } from "@tanstack/react-query";

export interface ListenTypeTopic {
    _id: string;
    slug: string;
    segments: Array<{
        order: number;
        text: string;
        audioUrl?: string;
        cloudinaryUrl?: string; // Cloudinary URL for the segment
        cloudinaryPublicId?: string; // Cloudinary public ID for the segment
        startMs: number;
        endMs: number;
    }>;
    cloudinaryUrl?: string; // Main Cloudinary URL
    cloudinaryPublicId?: string; // Main Cloudinary public ID
    fullTranscript?: string;
    createdAt?: string;
    updatedAt?: string;
}

const fetchTopics = async (): Promise<ListenTypeTopic[]> => {
    const response = await fetch("/api/listen-type/topics");
    if (!response.ok) {
        throw new Error("Failed to fetch topics");
    }
    return response.json();
};

export const useListenTopics = () => {
    return useQuery({
        queryKey: ["listenTopics"],
        queryFn: fetchTopics,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
