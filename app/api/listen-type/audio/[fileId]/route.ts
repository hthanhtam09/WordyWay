import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongoose";
import { getAudioFileStream, getAudioFileInfo } from "@/lib/gridfs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
): Promise<Response> {
  try {
    await connectMongoDB();
    const { fileId } = await params;

    // Get file info
    const fileInfo = await getAudioFileInfo(fileId);
    if (!fileInfo) {
      console.error("File not found:", fileId);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get audio stream
    const audioStream = await getAudioFileStream(fileId);

    // Set headers for audio streaming
    const headers = new Headers();
    headers.set("Content-Type", fileInfo.metadata?.contentType || "audio/mpeg");
    headers.set("Content-Length", fileInfo.length.toString());
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=31536000");

    // Convert stream to response
    const chunks: Uint8Array[] = [];
    return new Promise((resolve) => {
      audioStream.on("data", (chunk) => chunks.push(chunk));
      audioStream.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(new NextResponse(buffer, { headers }));
      });
      audioStream.on("error", (error) => {
        console.error("Stream error:", error);
        resolve(NextResponse.json({ error: "Stream error" }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error("Audio stream error:", error);
    return NextResponse.json({ error: "Audio stream failed" }, { status: 500 });
  }
}
