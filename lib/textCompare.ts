// Chuẩn hoá: lowerCase + trim + collapse spaces + bỏ punctuation cơ bản
export function normalize(s: string) {
    return s
        .toLowerCase()
        .normalize("NFKD") // loại diacritics nếu cần
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9'\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Diff word-level đơn giản (LCS)
export type DiffToken = { text: string; type: "equal" | "insert" | "delete" };
export function diffWords(a: string, b: string): DiffToken[] {
    const A = a.split(/\s+/),
        B = b.split(/\s+/);
    const m = A.length,
        n = B.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            dp[i][j] =
                A[i] === B[j]
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const out: DiffToken[] = [];
    let i = 0,
        j = 0;
    while (i < m && j < n) {
        if (A[i] === B[j]) {
            out.push({ text: A[i], type: "equal" });
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            out.push({ text: A[i], type: "delete" });
            i++;
        } else {
            out.push({ text: B[j], type: "insert" });
            j++;
        }
    }
    while (i < m) {
        out.push({ text: A[i++], type: "delete" });
    }
    while (j < n) {
        out.push({ text: B[j++], type: "insert" });
    }
    return out;
}

export function isCorrect(user: string, answer: string) {
    return normalize(user) === normalize(answer);
}
