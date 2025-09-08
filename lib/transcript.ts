import { toSeconds } from "./time";
import type { TranscriptSegment } from "./types";

export function splitSentences(text: string): string[] {
    return text
        .replace(/\s+/g, " ")
        .split(/(?<=[\.\?\!])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

export function parseWithMarkers(
    videoId: string,
    transcript: string
): TranscriptSegment[] {
    // Check if it's detailed timeline format (HH:MM:SS.mmm)
    if (
        transcript.includes("__RAW__") &&
        /^\d{2}:\d{2}:\d{2}\.\d{3}/m.test(transcript)
    ) {
        return parseDetailedTimeline(videoId, transcript);
    }

    // Original format with [MM:SS] or [HH:MM:SS] markers
    const parts = transcript
        .replace(/\r/g, "")
        .split(/(?=\[\d{1,2}:\d{2}(?::\d{2})?\])/g)
        .map((s) => s.trim())
        .filter(Boolean);

    const segments: TranscriptSegment[] = [];
    let order = 0;
    for (const p of parts) {
        // Avoid /s flag; use [\s\S] to match any char including newlines
        const match = p.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([\s\S]*)$/);
        if (!match) continue;
        const startSec = toSeconds(match[1]);
        const text = match[2].trim();
        segments.push({
            _id: `${videoId}-${order}`,
            videoId,
            order,
            startSec,
            endSec: null,
            text,
        });
        order++;
    }
    // set endSec từ startSec của đoạn tiếp theo
    for (let i = 0; i < segments.length - 1; i++) {
        segments[i].endSec = segments[i + 1].startSec;
    }
    return segments;
}

export function parseDetailedTimeline(
    videoId: string,
    transcript: string
): TranscriptSegment[] {
    // Extract timeline data after __RAW__
    const timelineData = transcript.replace("__RAW__", "").trim();
    const lines = timelineData.split("\n").filter((line) => line.trim());

    const segments: TranscriptSegment[] = [];
    let order = 0;

    for (const line of lines) {
        // Parse format: HH:MM:SS.mmm text
        const match = line.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+(.*)$/);
        if (!match) continue;

        const [_, hours, minutes, seconds, milliseconds, text] = match;
        const startSec =
            parseInt(hours) * 3600 +
            parseInt(minutes) * 60 +
            parseInt(seconds) +
            parseInt(milliseconds) / 1000;

        segments.push({
            _id: `${videoId}-${order}`,
            videoId,
            order,
            startSec: Math.round(startSec * 100) / 100, // Round to 2 decimal places
            endSec: null,
            text: text.trim(),
        });
        order++;
    }

    // Set endSec for all segments
    for (let i = 0; i < segments.length - 1; i++) {
        segments[i].endSec = segments[i + 1].startSec;
    }

    return segments;
}

export function estimateByDuration(
    videoId: string,
    transcript: string,
    durationSec: number
): TranscriptSegment[] {
    const sentences = splitSentences(transcript);
    if (sentences.length === 0) return [];

    const totalWords =
        sentences.reduce((acc, s) => acc + s.split(/\s+/).length, 0) || 1;

    let wordCum = 0;
    const segs = sentences.map((s, idx) => {
        const words = s.split(/\s+/).length;
        const ratio = wordCum / totalWords;
        const startSec = Math.floor(ratio * durationSec);
        wordCum += words;
        return {
            _id: `${videoId}-${idx}`,
            videoId,
            order: idx,
            startSec,
            endSec: null,
            text: s,
        } as TranscriptSegment;
    });

    // Set endSec for all segments
    for (let i = 0; i < segs.length - 1; i++) {
        segs[i].endSec = segs[i + 1].startSec;
    }

    // Ensure the last segment ends at the video duration
    if (segs.length > 0) {
        segs[segs.length - 1].endSec = durationSec;
    }

    return segs;
}

export function hasTimeMarkers(transcript: string): boolean {
    return /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(transcript);
}

export function parseTranscript(
    videoId: string,
    transcript: string,
    durationSec?: number
): TranscriptSegment[] {
    // Prefer detailed HH:MM:SS.mmm timeline if present
    if (
        /^\d{2}:\d{2}:\d{2}\.\d{3}/m.test(transcript) ||
        /^__RAW__\s*\d{2}:\d{2}:\d{2}\.\d{3}/m.test(transcript)
    ) {
        return parseDetailedTimeline(videoId, transcript);
    }

    if (hasTimeMarkers(transcript)) {
        return parseWithMarkers(videoId, transcript);
    }

    if (durationSec && durationSec > 0) {
        return estimateByDuration(videoId, transcript, durationSec);
    }

    // Fallback: không có duration, tạo segments với startSec = 0
    const sentences = splitSentences(transcript);
    if (sentences.length === 0) return [];

    return sentences.map((s, idx) => ({
        _id: `${videoId}-${idx}`,
        videoId,
        order: idx,
        startSec: 0,
        endSec: idx < sentences.length - 1 ? 0 : null,
        text: s,
    }));
}
