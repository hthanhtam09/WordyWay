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

export function secToMMSS(sec: number): string {
    const s = Math.floor(sec % 60)
        .toString()
        .padStart(2, "0");
    const m = Math.floor(sec / 60)
        .toString()
        .padStart(2, "0");
    return `${m}:${s}`;
}
