import { useQuery } from "@tanstack/react-query";
import type { IListenTypeTopic } from "@/models/ListenTypeTopic";

export async function fetchListenTopic(slug: string) {
  const res = await fetch(
    `/api/listen-type/topics/${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load topic");
  return (await res.json()) as IListenTypeTopic;
}

export const useListenTopic = (slug: string) => {
  return useQuery({
    queryKey: ["listenTopic", slug],
    queryFn: () => fetchListenTopic(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
