export function toSeconds(ts: string): number {
    const clean = ts.replace(/\[|\]/g, "");
    const parts = clean.split(":").map(Number);
    if (parts.length === 3) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
    }
    if (parts.length === 2) {
        const [m, s] = parts;
        return m * 60 + s;
    }
    return 0;
}

export function secToHHMMSS(sec: number): string {
    const s = Math.floor(sec % 60)
        .toString()
        .padStart(2, "0");
    const m = Math.floor((sec / 60) % 60)
        .toString()
        .padStart(2, "0");
    const h = Math.floor(sec / 3600).toString();
    return h !== "0" ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export function formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function parseTimeString(timeStr: string): number {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 3) {
        const [h, m, s] = parts;
        return h * 3600 + m * 60 + s;
    }
    if (parts.length === 2) {
        const [m, s] = parts;
        return m * 60 + s;
    }
    return 0;
}
