import { useState, useCallback } from "react";

interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

interface CloudinaryUploadResult {
    publicId: string;
    url: string;
    format: string;
    bytes: number;
}

interface UseCloudinaryUploadReturn {
    uploadFile: (
        file: File,
        topic?: string,
        folder?: string
    ) => Promise<CloudinaryUploadResult>;
    uploadProgress: UploadProgress | null;
    isUploading: boolean;
    error: string | null;
    clearError: () => void;
}

export const useCloudinaryUpload = (): UseCloudinaryUploadReturn => {
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
        null
    );
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const uploadFile = useCallback(
        async (
            file: File,
            topic?: string,
            folder?: string
        ): Promise<CloudinaryUploadResult> => {
            setIsUploading(true);
            setError(null);
            setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

            try {
                const formData = new FormData();
                formData.append("file", file);

                if (topic) {
                    formData.append("topic", topic);
                }

                if (folder) {
                    formData.append("folder", folder);
                }

                const response = await fetch("/api/cloudinary/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Upload failed");
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || "Upload failed");
                }

                setUploadProgress({
                    loaded: file.size,
                    total: file.size,
                    percentage: 100,
                });

                return result.data;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Upload failed";
                setError(errorMessage);
                throw err;
            } finally {
                setIsUploading(false);
                // Clear progress after a short delay
                setTimeout(() => {
                    setUploadProgress(null);
                }, 1000);
            }
        },
        []
    );

    return {
        uploadFile,
        uploadProgress,
        isUploading,
        error,
        clearError,
    };
};
