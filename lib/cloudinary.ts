import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Types for Cloudinary upload
export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
}

export interface UploadOptions {
    folder?: string;
    resource_type?: "image" | "video" | "raw" | "auto";
    public_id?: string;
    overwrite?: boolean;
    tags?: string[];
    topic?: string; // Add topic for naming
}

/**
 * Upload a file to Cloudinary
 * @param filePath - Path to the file to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
    filePath: string,
    options: UploadOptions = {}
): Promise<CloudinaryUploadResult> => {
    try {
        // Extract filename and topic for public_id
        const filename = path.basename(filePath, path.extname(filePath));
        const folder = options.folder || "audio-topics";
        const topic = options.topic || "unknown";

        // Format: [topic]_[filename] (without folder prefix to avoid duplication)
        const publicId = options.public_id || `${topic}_${filename}`;

        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "raw", // For MP3 files
            folder: folder,
            public_id: publicId,
            overwrite: options.overwrite || true,
            tags: options.tags || ["audio", "mp3"],
            ...options,
        });

        return {
            public_id: result.public_id,
            secure_url: result.secure_url,
            format: result.format,
            resource_type: result.resource_type,
            bytes: result.bytes,
        };
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw new Error(`Failed to upload file: ${error}`);
    }
};

/**
 * Upload multiple files to Cloudinary
 * @param filePaths - Array of file paths to upload
 * @param options - Upload options
 * @returns Promise with array of upload results
 */
export const uploadMultipleToCloudinary = async (
    filePaths: string[],
    options: UploadOptions = {}
): Promise<CloudinaryUploadResult[]> => {
    try {
        const uploadPromises = filePaths.map((filePath) =>
            uploadToCloudinary(filePath, options)
        );

        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error("Error uploading multiple files to Cloudinary:", error);
        throw new Error(`Failed to upload files: ${error}`);
    }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - Public ID of the file to delete
 * @param resourceType - Type of resource (default: 'raw')
 * @returns Promise with deletion result
 */
export const deleteFromCloudinary = async (
    publicId: string,
    resourceType: "image" | "video" | "raw" = "raw"
): Promise<{ result: string }> => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        return result;
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        throw new Error(`Failed to delete file: ${error}`);
    }
};

/**
 * Get Cloudinary URL for a public ID
 * @param publicId - Public ID of the file
 * @param options - URL transformation options
 * @returns Cloudinary URL
 */
export const getCloudinaryUrl = (
    publicId: string,
    options: {
        resource_type?: "image" | "video" | "raw";
        format?: string;
        quality?: string | number;
    } = {}
): string => {
    return cloudinary.url(publicId, {
        resource_type: options.resource_type || "raw",
        format: options.format,
        quality: options.quality,
        secure: true,
    });
};
