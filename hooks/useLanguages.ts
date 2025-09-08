"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLanguages() {
    return useQuery({
        queryKey: ["languages"],
        queryFn: async () => {
            const { languages } = await api.getLanguages();
            return languages;
        },
    });
}
