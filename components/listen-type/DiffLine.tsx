"use client";
import { diffWords } from "@/lib/textCompare";

export default function DiffLine({
    user,
    answer,
}: {
    user: string;
    answer: string;
}) {
    const tokens = diffWords(user, answer);
    return (
        <div className="rounded-xl border border-border p-3 bg-card/50">
            <div className="text-sm mb-2 opacity-70">Your input</div>
            <div className="flex flex-wrap gap-1 mb-3">
                {tokens.map((t, i) => (
                    <span
                        key={`u-${i}`}
                        className={
                            t.type === "equal"
                                ? "px-1 rounded bg-emerald-900/30 text-emerald-200"
                                : t.type === "delete"
                                    ? "px-1 rounded bg-rose-900/40 text-rose-200 line-through"
                                    : "px-1 rounded bg-slate-700/40 text-slate-200"
                        }
                    >
                        {t.text}
                    </span>
                ))}
            </div>
            <div className="text-sm mb-2 opacity-70">Answer</div>
            <div className="rounded bg-muted/40 p-2">{answer}</div>
        </div>
    );
}
