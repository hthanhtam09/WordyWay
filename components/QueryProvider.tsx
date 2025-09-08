"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

interface QueryProviderProps {
    children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
                        retry: (failureCount, error) => {
                            // Don't retry on 404 errors
                            if (
                                error &&
                                typeof error === "object" &&
                                "status" in error &&
                                error.status === 404
                            ) {
                                return false;
                            }
                            // Retry up to 3 times for other errors
                            return failureCount < 3;
                        },
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
