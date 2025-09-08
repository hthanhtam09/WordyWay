import { useState, useEffect, useCallback, useRef } from "react";

interface UseAsyncDataOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    dependencies?: unknown[];
    skip?: boolean;
}

interface UseAsyncDataReturn<T> {
    data: T | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

export function useAsyncData<T>(
    fetchFn: () => Promise<T>,
    options: UseAsyncDataOptions<T> = {}
): UseAsyncDataReturn<T> {
    const { onSuccess, onError, skip = false } = options;
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchFnRef = useRef(fetchFn);
    const isMountedRef = useRef(true);

    // Update the ref when fetchFn changes
    fetchFnRef.current = fetchFn;

    const fetchData = useCallback(async () => {
        if (skip) return;

        try {
            setIsLoading(true);
            setError(null);
            const result = await fetchFnRef.current();

            if (isMountedRef.current) {
                setData(result);
                onSuccess?.(result);
            }
        } catch (err) {
            if (isMountedRef.current) {
                let errorMessage = "An error occurred";

                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === "string") {
                    errorMessage = err;
                } else if (err && typeof err === "object" && "error" in err) {
                    errorMessage = String(err.error);
                }

                setError(errorMessage);
                onError?.(errorMessage);
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [skip, onSuccess, onError]);

    useEffect(() => {
        isMountedRef.current = true;
        if (!skip) {
            fetchData();
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchData, skip]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
    };
}

export function useAsyncDataMultiple<T>(
    fetchFns: (() => Promise<T>)[],
    options: UseAsyncDataOptions<T[]> = {}
): UseAsyncDataReturn<T[]> {
    const { onSuccess, onError, dependencies = [], skip = false } = options;
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchFnsRef = useRef(fetchFns);
    const isMountedRef = useRef(true);

    // Update the ref when fetchFns changes
    fetchFnsRef.current = fetchFns;

    const fetchData = useCallback(async () => {
        if (skip) return;

        try {
            setIsLoading(true);
            setError(null);
            const results = await Promise.all(fetchFnsRef.current.map((fn) => fn()));

            if (isMountedRef.current) {
                setData(results);
                onSuccess?.(results);
            }
        } catch (err) {
            if (isMountedRef.current) {
                let errorMessage = "An error occurred";

                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === "string") {
                    errorMessage = err;
                } else if (err && typeof err === "object" && "error" in err) {
                    errorMessage = String(err.error);
                }

                setError(errorMessage);
                onError?.(errorMessage);
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [skip, onSuccess, onError]);

    useEffect(() => {
        isMountedRef.current = true;
        if (!skip) {
            fetchData();
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [fetchData, skip]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchData,
    };
}
