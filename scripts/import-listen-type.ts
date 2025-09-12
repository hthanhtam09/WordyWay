#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { connectMongoDB } from "@/lib/mongoose";
import { ListenTypeTopic } from "@/models/ListenTypeTopic";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface CSVRow {
  slug: string;
  audioUrls: string;
  segmentTexts: string;
}

interface AudioSegment {
  order: number;
  text: string;
  audioUrl: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  startMs: number;
  endMs: number;
}

interface TopicData {
  slug: string;
  segments: AudioSegment[];
  fullTranscript: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}

/**
 * Parse CSV file with proper handling of quoted multi-line values
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");

  // Simple CSV parser that handles quoted values
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        // Escaped quote
        currentLine += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === "\n" && !inQuotes) {
      // End of line outside quotes
      lines.push(currentLine);
      currentLine = "";
    } else {
      currentLine += char;
    }
  }

  // Add the last line
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length < 2) {
    throw new Error(
      "CSV file must have at least a header row and one data row"
    );
  }

  // Parse header
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

  // Parse data rows
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values: string[] = [];
    let current = "";
    let inQuotes2 = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        if (inQuotes2 && line[j + 1] === '"') {
          // Escaped quote
          current += '"';
          j++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes2 = !inQuotes2;
        }
      } else if (char === "," && !inQuotes2) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last value
    values.push(current.trim());

    // Create row object
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    rows.push({
      slug: row.slug,
      audioUrls: row.audioUrls,
      segmentTexts: row.segmentTexts,
    });
  }

  return rows;
}

/**
 * Parse multi-line string into array
 */
function parseMultiLineString(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Get MP3 duration using ffprobe or estimate from file size
 */
async function getMP3Duration(filePath: string): Promise<number> {
  try {
    // Try to use ffprobe if available
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);

    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`
      );
      const duration = parseFloat(stdout.trim());
      if (!isNaN(duration) && duration > 0) {
        return Math.round(duration * 1000); // Convert to milliseconds
      }
    } catch {
      // ffprobe not available, continue to fallback
    }

    // Fallback: estimate duration from file size
    const stats = fs.statSync(filePath);
    const fileSizeBytes = stats.size;

    // For small files (likely placeholders), use default duration
    if (fileSizeBytes < 1000) {
      return 3000; // 3 seconds
    }

    // Rough estimation: 128kbps MP3 ≈ 1MB per minute
    const estimatedDurationMs = Math.round(
      (fileSizeBytes / 1024 / 1024) * 60 * 1000
    );

    // Ensure reasonable duration (between 1-30 seconds for typical segments)
    return Math.max(Math.min(estimatedDurationMs, 30000), 1000);
  } catch {
    console.log(
      `   ⚠️  Could not get duration for ${path.basename(filePath)}, using default`
    );
    return 5000; // Default 5 seconds
  }
}

/**
 * Create real tone-based WAV file (browser compatible)
 */
function createRealToneWAV(
  filePath: string,
  frequency: number = 440,
  duration: number = 3
): void {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration);
  const bytesPerSample = 2;
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const fileSize = 44 + dataSize - 8;

  // Create a simple sine wave
  const audioData = new Array(samples).fill(0).map((_, i) => {
    const t = i / sampleRate;
    return Math.sin(2 * Math.PI * frequency * t) * 0.3; // 30% volume
  });

  // Convert to 16-bit PCM
  const pcmData = audioData.map((sample) => {
    const pcm = Math.round(sample * 32767);
    return Math.max(-32768, Math.min(32767, pcm));
  });

  // Create WAV file buffer
  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // WAV header
  buffer.write("RIFF", offset);
  offset += 4;
  buffer.writeUInt32LE(fileSize, offset);
  offset += 4;
  buffer.write("WAVE", offset);
  offset += 4;
  buffer.write("fmt ", offset);
  offset += 4;
  buffer.writeUInt32LE(16, offset);
  offset += 4; // fmt chunk size
  buffer.writeUInt16LE(1, offset);
  offset += 2; // audio format (PCM)
  buffer.writeUInt16LE(numChannels, offset);
  offset += 2; // channels
  buffer.writeUInt32LE(sampleRate, offset);
  offset += 4; // sample rate
  buffer.writeUInt32LE(byteRate, offset);
  offset += 4; // byte rate
  buffer.writeUInt16LE(blockAlign, offset);
  offset += 2; // block align
  buffer.writeUInt16LE(16, offset);
  offset += 2; // bits per sample
  buffer.write("data", offset);
  offset += 4;
  buffer.writeUInt32LE(dataSize, offset);
  offset += 4;

  // Audio data
  for (let i = 0; i < samples; i++) {
    buffer.writeInt16LE(pcmData[i], offset);
    offset += 2;
  }

  fs.writeFileSync(filePath, buffer);
}

/**
 * Check if a file is a placeholder MP3
 */
function isPlaceholderMP3(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    // Placeholder files are typically very small (around 232 bytes)
    if (stats.size < 1000) {
      // Check for placeholder pattern
      const header = buffer.slice(0, 4);
      const isMP3Header = header[0] === 0xff && header[1] === 0xfb;
      const hasNullData = buffer.slice(4, 20).every((byte) => byte === 0x00);

      return isMP3Header && hasNullData;
    }

    return false;
  } catch (error) {
    console.error(`Error checking file ${filePath}:`, error);
    return false;
  }
}

/**
 * Upload audio file to Cloudinary
 */
async function uploadAudioToCloudinary(
  filePath: string,
  topic: string,
  segmentOrder: number
): Promise<{ url: string; publicId: string }> {
  try {
    // Add timestamp to force new URLs
    const timestamp = Date.now();
    const result = await uploadToCloudinary(filePath, {
      folder: `audio-topics/${topic}`,
      resource_type: "raw",
      public_id: `${topic}_${segmentOrder}_${timestamp}`,
      overwrite: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(`   ❌ Failed to upload ${path.basename(filePath)}:`, error);
    throw error;
  }
}

/**
 * Process topic data and upload to Cloudinary
 */
async function processTopicData(topicData: TopicData): Promise<TopicData> {
  console.log(`\n📁 Processing topic: ${topicData.slug}`);

  // Create local audio files if they don't exist
  console.log("   🔍 Checking local audio files...");
  let createdCount = 0;

  for (let i = 0; i < topicData.segments.length; i++) {
    const segment = topicData.segments[i];
    const audioPath = path.join(process.cwd(), "public", segment.audioUrl);
    const folderPath = path.dirname(audioPath);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(
        `   📁 Created folder: ${path.relative(process.cwd(), folderPath)}`
      );
    }

    // Create real audio file if it doesn't exist
    if (!fs.existsSync(audioPath)) {
      // Create different tones for each segment
      const frequency = 440 + i * 50; // Different frequency for each segment
      const duration = 2 + i * 0.5; // Different duration for each segment

      // Change extension to .wav for real audio files
      const wavPath = audioPath.replace(".mp3", ".wav");
      createRealToneWAV(wavPath, frequency, duration);

      // Update the segment to use WAV file
      segment.audioUrl = segment.audioUrl.replace(".mp3", ".wav");

      console.log(
        `   🎵 Created: ${segment.audioUrl} (${frequency}Hz, ${duration}s)`
      );
      createdCount++;
    } else {
      console.log(`   ✅ Exists: ${segment.audioUrl}`);
    }
  }

  if (createdCount > 0) {
    console.log(`   🎉 Created ${createdCount} real audio files!`);
  }

  // Get durations for all segments
  console.log("   🎵 Getting MP3 durations...");
  for (let i = 0; i < topicData.segments.length; i++) {
    const segment = topicData.segments[i];
    const audioPath = path.join(process.cwd(), "public", segment.audioUrl);

    if (fs.existsSync(audioPath)) {
      const durationMs = await getMP3Duration(audioPath);
      segment.startMs = 0;
      segment.endMs = durationMs;
      console.log(`   📊 ${path.basename(segment.audioUrl)}: ${durationMs}ms`);
    }
  }

  // Upload to Cloudinary (skip placeholder files)
  console.log("   ☁️  Uploading to Cloudinary...");
  const uploadPromises = topicData.segments.map(async (segment, index) => {
    const audioPath = path.join(process.cwd(), "public", segment.audioUrl);

    if (fs.existsSync(audioPath)) {
      // Upload WAV files (skip old MP3 placeholders)
      if (audioPath.endsWith(".mp3") && isPlaceholderMP3(audioPath)) {
        console.log(
          `   ⚠️  Skipping old placeholder file: ${path.basename(segment.audioUrl)}`
        );
        return;
      }

      try {
        const cloudinaryResult = await uploadAudioToCloudinary(
          audioPath,
          topicData.slug,
          index + 1
        );

        segment.cloudinaryUrl = cloudinaryResult.url;
        segment.cloudinaryPublicId = cloudinaryResult.publicId;

        console.log(
          `   ✅ Uploaded segment ${index + 1}: ${cloudinaryResult.publicId}`
        );
      } catch (error) {
        console.error(`   ❌ Failed to upload segment ${index + 1}:`, error);
        // Continue with other segments even if one fails
      }
    }
  });

  await Promise.all(uploadPromises);

  // Set main audio URL (first segment)
  if (topicData.segments.length > 0 && topicData.segments[0].cloudinaryUrl) {
    topicData.cloudinaryUrl = topicData.segments[0].cloudinaryUrl;
    topicData.cloudinaryPublicId = topicData.segments[0].cloudinaryPublicId;
  }

  return topicData;
}

/**
 * Import from CSV file
 */
async function importFromCSV(csvPath: string): Promise<void> {
  console.log(`📄 Importing from CSV: ${csvPath}`);

  const csvData = parseCSV(csvPath);
  console.log(`📊 Parsed ${csvData.length} rows`);

  // Process each topic
  const topics = new Map<string, TopicData>();

  for (const row of csvData) {
    const audioUrls = parseMultiLineString(row.audioUrls);
    const segmentTexts = parseMultiLineString(row.segmentTexts);

    const segments: AudioSegment[] = [];
    const maxLength = Math.max(audioUrls.length, segmentTexts.length);

    for (let i = 0; i < maxLength; i++) {
      segments.push({
        order: i + 1,
        text: segmentTexts[i] || "",
        audioUrl: audioUrls[i] || `/audio-topics/${row.slug}/${i + 1}.mp3`,
        startMs: 0,
        endMs: 0,
      });
    }

    const fullTranscript = segmentTexts.join(" ");

    topics.set(row.slug, {
      slug: row.slug,
      segments,
      fullTranscript,
    });
  }

  console.log(`📁 Found ${topics.size} topics`);

  // Process each topic (create files, upload to Cloudinary)
  const processedTopics: TopicData[] = [];

  for (const [slug, topicData] of topics) {
    try {
      const processedTopic = await processTopicData(topicData);
      processedTopics.push(processedTopic);
    } catch (error) {
      console.error(`❌ Failed to process topic ${slug}:`, error);
      // Continue with other topics
    }
  }

  // Save to database
  await connectMongoDB();
  console.log("\n💾 Saving to database...");

  for (const topicData of processedTopics) {
    try {
      const doc = {
        slug: topicData.slug,
        fullTranscript: topicData.fullTranscript,
        cloudinaryUrl: topicData.cloudinaryUrl,
        cloudinaryPublicId: topicData.cloudinaryPublicId,
        segments: topicData.segments,
      };

      console.log(
        `   🔍 Updating ${topicData.slug} with new Cloudinary URLs...`
      );
      console.log(`   📊 Main URL: ${topicData.cloudinaryUrl}`);
      console.log(
        `   📊 Segments with Cloudinary: ${topicData.segments.filter((s) => s.cloudinaryUrl).length}`
      );

      // Delete existing document first to ensure clean update
      await ListenTypeTopic.deleteOne({ slug: topicData.slug });

      // Create new document
      await ListenTypeTopic.create(doc);

      console.log(
        `   ✅ ${topicData.slug} (${topicData.segments.length} segments) - Created successfully`
      );
    } catch (error) {
      console.error(`   ❌ Failed to save ${topicData.slug}:`, error);
    }
  }

  console.log("\n🎉 CSV import completed successfully!");
  console.log("\n🌐 Topics available at:");
  for (const topicData of processedTopics) {
    console.log(`   http://localhost:3002/listen-type/${topicData.slug}`);
  }

  console.log("\n📊 Summary:");
  console.log(`   Topics processed: ${processedTopics.length}`);
  console.log(
    `   Total segments: ${processedTopics.reduce((sum, t) => sum + t.segments.length, 0)}`
  );
  console.log(
    `   Cloudinary uploads: ${processedTopics.reduce((sum, t) => sum + t.segments.filter((s) => s.cloudinaryUrl).length, 0)}`
  );
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log("  npm run import:listen-type <csv_file_path>");
    console.log("");
    console.log("Examples:");
    console.log("  npm run import:listen-type ./data/listen_type.csv");
    console.log("");
    console.log("This script will:");
    console.log("  1. Parse CSV file");
    console.log("  2. Create local audio files (if missing)");
    console.log("  3. Upload audio files to Cloudinary");
    console.log("  4. Save topic data to database");
    console.log("  5. Generate URLs for testing");
    process.exit(1);
  }

  const csvPath = args[0];

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  if (!fs.statSync(csvPath).isFile()) {
    console.error(`❌ Path is not a file: ${csvPath}`);
    process.exit(1);
  }

  try {
    await importFromCSV(csvPath);
    console.log("\n✅ Import completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

// Run the script
main();
