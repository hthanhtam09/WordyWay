import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { connectMongoDB, disconnectMongoDB } from "@/lib/mongoose";
import { Video, TranscriptSegment } from "@/models/Video";

// Load environment variables
config({ path: ".env.local" });

function extractYoutubeId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace("/", "");
    }
    if (u.searchParams.get("v")) {
      return u.searchParams.get("v") as string;
    }
    // fallback cho dạng /embed/{id}
    const parts = u.pathname.split("/");
    const idx = parts.findIndex((p) => p === "embed");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {}
  return url; // cuối cùng trả về chuỗi gốc
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

function extractDurationFromTranscript(transcript: string): number | undefined {
  // Extract all timestamps from transcript (format: HH:MM:SS.mmm)
  const timestampRegex = /(\d{2}):(\d{2}):(\d{2})\.(\d{3})/g;
  const timestamps: number[] = [];

  let match;
  while ((match = timestampRegex.exec(transcript)) !== null) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const milliseconds = parseInt(match[4], 10);

    const totalSeconds =
      hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    timestamps.push(totalSeconds);
  }

  // Return the last timestamp as the duration
  if (timestamps.length > 0) {
    return Math.ceil(Math.max(...timestamps));
  }

  return undefined;
}

type Row = { name: string; url: string; transcript: string; language: string };

// Robust CSV parser that supports quoted fields containing commas and newlines
function parseCSV(raw: string): Row[] {
  // Normalize newlines to \n
  const input = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Tokenize into rows with a state machine
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          // Escaped quote
          currentField += '"';
          i++; // skip next
        } else {
          // End quote
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentField.trim());
      currentField = "";
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  // Push last field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  const idxName = headers.indexOf("name");
  const idxUrl = headers.indexOf("url");
  const idxTranscript = headers.indexOf("transcript");
  const idxLanguage = headers.indexOf("language");

  if (idxName < 0 || idxUrl < 0 || idxTranscript < 0 || idxLanguage < 0) {
    throw new Error("CSV must include headers: name,url,language,transcript");
  }

  const dataRows = rows.slice(1);
  const result: Row[] = [];
  for (const r of dataRows) {
    // Allow short rows; missing fields become empty strings
    const name = (r[idxName] ?? "").trim();
    const url = (r[idxUrl] ?? "").trim();
    const language = (r[idxLanguage] ?? "en").trim();
    const transcript = (r[idxTranscript] ?? "").trim();
    if (!name && !url && !transcript) continue;
    result.push({ name, url, transcript, language });
  }

  return result;
}

async function main() {
  const csvPath =
    process.argv[2] ?? path.join(process.cwd(), "data", "videos.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  // Connect to MongoDB
  await connectMongoDB();
  console.log(
    "MongoDB connection URI:",
    process.env.MONGODB_URI || "mongodb://localhost:27017/wordyway"
  );

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(raw);

  console.log(`Found ${rows.length} videos to import...`);

  for (const row of rows) {
    const youtubeId = extractYoutubeId(row.url);
    const slug = generateSlug(row.name);

    console.log(`Importing: ${row.name} (${youtubeId}) - slug: ${slug}`);

    // Check if video already exists by slug
    const existingVideo = await Video.findOne({ slug });
    console.log(`  Checking for existing video with slug: ${slug}`);
    console.log(`  Found existing video:`, existingVideo ? "YES" : "NO");
    if (existingVideo) {
      console.log(`  Video already exists, skipping...`);
      continue;
    }

    // Extract duration from transcript
    const durationSec = extractDurationFromTranscript(row.transcript);
    console.log(
      `  Duration: ${durationSec ? `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, "0")}` : "Unknown"}`
    );

    const video = new Video({
      name: row.name,
      slug,
      url: row.url,
      youtubeId,
      language: row.language,
      durationSec,
    });

    await video.save();

    // Lưu raw transcript đầy đủ bằng 1 segment order=-1 để phục vụ parsing phía client
    const rawSegment = new TranscriptSegment({
      videoId: video._id.toString(),
      order: -1,
      startSec: 0,
      endSec: null,
      text: `__RAW__ ${row.transcript}`,
    });

    await rawSegment.save();

    // Nếu transcript có định dạng thời gian chi tiết (HH:MM:SS.mmm) hoặc marker [MM:SS]
    // → tách & insert segment với startSec chính xác. Nếu không → bỏ qua, sẽ ước lượng khi render.
    const hasDetailed = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})/m.test(
      row.transcript
    );
    const hasMarker = /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(row.transcript);

    if (hasDetailed) {
      console.log(`  Parsing transcript with detailed timeline...`);
      const lines = row.transcript.replace(/\r/g, "").split("\n");
      let order = 0;
      for (const line of lines) {
        const m = line.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+(.*)$/);
        if (!m) continue;
        const h = parseInt(m[1], 10);
        const mi = parseInt(m[2], 10);
        const s = parseInt(m[3], 10);
        const ms = parseInt(m[4], 10);
        const startSec = h * 3600 + mi * 60 + s + ms / 1000;
        const text = m[5].trim();
        const segment = new TranscriptSegment({
          videoId: video._id.toString(),
          order,
          startSec: Math.round(startSec * 100) / 100,
          endSec: null,
          text,
        });
        await segment.save();
        order++;
      }
      console.log(`  Created ${order} transcript segments (detailed)`);
    } else if (hasMarker) {
      console.log(`  Parsing transcript with time markers...`);
      const blocks = row.transcript
        .replace(/\r/g, "")
        .split(/(?=\[\d{1,2}:\d{2}(?::\d{2})?\])/g)
        .map((s) => s.trim())
        .filter(Boolean);

      let order = 0;
      for (const block of blocks) {
        const match = block.match(
          /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/
        );
        if (!match) continue;
        const [, timeStr, text] = match;
        const parts = timeStr.split(":").map(Number);
        const startSec =
          parts.length === 3
            ? parts[0] * 3600 + parts[1] * 60 + parts[2]
            : parts[0] * 60 + parts[1];
        const segment = new TranscriptSegment({
          videoId: video._id.toString(),
          order,
          startSec,
          endSec: null,
          text: text.trim(),
        });
        await segment.save();
        order++;
      }
      console.log(`  Created ${order} transcript segments (markers)`);
    } else {
      console.log(`  No time markers found - will estimate timing at runtime`);
    }
  }

  console.log("Import completed successfully!");
}

main()
  .catch((e) => {
    console.error("Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMongoDB();
  });
