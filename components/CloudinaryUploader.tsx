"use client";

import { useState, useRef } from "react";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

interface CloudinaryUploaderProps {
    topic?: string;
    folder?: string;
    onUploadSuccess?: (result: {
        publicId: string;
        url: string;
        format: string;
        bytes: number;
    }) => void;
    onUploadError?: (error: string) => void;
    className?: string;
    accept?: string;
    maxSize?: number; // in bytes
}

export const CloudinaryUploader: React.FC<CloudinaryUploaderProps> = ({
    topic,
    folder,
    onUploadSuccess,
    onUploadError,
    className = "",
    accept = "audio/*,.mp3",
    maxSize = 50 * 1024 * 1024, // 50MB default
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const { uploadFile, uploadProgress, isUploading, error, clearError } =
        useCloudinaryUpload();

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];

        // Validate file size
        if (file.size > maxSize) {
            const errorMsg = `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`;
            onUploadError?.(errorMsg);
            return;
        }

        // Validate file type
        if (!file.type.startsWith("audio/") && !file.name.endsWith(".mp3")) {
            const errorMsg = "Please select an audio file (MP3, WAV, etc.)";
            onUploadError?.(errorMsg);
            return;
        }

        try {
            clearError();
            const result = await uploadFile(file, topic, folder);
            onUploadSuccess?.(result);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Upload failed";
            onUploadError?.(errorMsg);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Upload Area */}
            <div
                className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    }
          ${isUploading ? "pointer-events-none opacity-50" : ""}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
                tabIndex={0}
                role="button"
                aria-label="Upload audio file"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="space-y-4">
                        <div className="w-12 h-12 mx-auto">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Uploading...
                            </p>
                            {uploadProgress && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress.percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {uploadProgress.percentage.toFixed(1)}% -{" "}
                                        {formatFileSize(uploadProgress.loaded)} /{" "}
                                        {formatFileSize(uploadProgress.total)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500">
                            <svg
                                className="w-full h-full"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {dragActive
                                    ? "Drop audio file here"
                                    : "Click to upload or drag and drop"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                MP3, WAV, or other audio formats (max {formatFileSize(maxSize)})
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={clearError}
                                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                                aria-label="Clear error"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
