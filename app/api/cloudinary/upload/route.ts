import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const topic = formData.get("topic") as string;
    const folder = formData.get("folder") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("audio/") && !file.name.endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed." },
        { status: 400 }
      );
    }

    // Convert File to buffer and save temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a temporary file path
    const tempFilePath = `/tmp/${Date.now()}-${file.name}`;

    try {
      // Write buffer to temporary file
      const fs = await import("fs");
      fs.writeFileSync(tempFilePath, buffer);

      // Upload to Cloudinary
      const result = await uploadToCloudinary(tempFilePath, {
        folder: folder || `audio-topics/${topic || "uploads"}`,
        resource_type: "raw",
        overwrite: true,
        tags: [
          "audio",
          "mp3",
          topic?.toLowerCase().replace(/\s+/g, "-") || "upload",
        ],
      });

      // Clean up temporary file
      fs.unlinkSync(tempFilePath);

      return NextResponse.json({
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          bytes: result.bytes,
        },
      });
    } catch (uploadError) {
      // Clean up temporary file if it exists
      try {
        const fs = await import("fs");
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }

      throw uploadError;
    }
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);

    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Cloudinary upload endpoint",
    methods: ["POST"],
    description: "Upload audio files to Cloudinary storage",
  });
}
