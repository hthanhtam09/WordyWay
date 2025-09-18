import { useQuery } from "@tanstack/react-query";
import { Book } from "@/lib/types";

const fetchBooks = async (language?: string): Promise<Book[]> => {
  const url = language
    ? `/api/books?language=${encodeURIComponent(language)}`
    : "/api/books";

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }
  return response.json();
};

export const useBooks = (language?: string) => {
  return useQuery({
    queryKey: ["books", language],
    queryFn: () => fetchBooks(language),
  });
};
