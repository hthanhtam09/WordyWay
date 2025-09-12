"use client";
import { useMemo, useState } from "react";
import type { IListenTypeSegment } from "@/models/ListenTypeTopic";
import { isCorrect, normalize } from "@/lib/textCompare";
import DiffLine from "./DiffLine";

export default function SegmentInput({
  seg,
  index,
  onResult,
}: {
  seg: IListenTypeSegment;
  index: number;
  audio?: HTMLAudioElement | null;
  onResult?: (segmentIndex: number, isCorrect: boolean) => void;
}) {
  const [val, setVal] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [showAns, setShowAns] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const ok = useMemo(
    () => (checked === null ? null : isCorrect(val, seg.text)),
    [checked, val, seg.text]
  );

  const handleCheck = () => {
    setChecked(true);
    const isCorrectResult = isCorrect(val, seg.text);

    // Trigger shake animation for incorrect answers
    if (!isCorrectResult) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    // Notify parent component about the result
    if (onResult) {
      onResult(index, isCorrectResult);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCheck();
    }
  };

  return (
    <div className="rounded-2xl border border-border p-4 bg-card">
      <div className="flex items-center justify-end gap-3 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAns((v) => !v)}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted"
          >
            {showAns ? "Hide answer" : "Show answer"}
          </button>
        </div>
      </div>

      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type what you hear..."
        className={`w-full rounded-xl p-3 outline-none transition-all duration-200 ${
          checked !== null
            ? ok
              ? "border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
              : `border-2 border-red-500 bg-red-50 dark:bg-red-950/20 ${
                  isShaking ? "animate-shake" : ""
                }`
            : "border border-border bg-background focus:ring-2 focus:ring-emerald-600/40"
        }`}
        rows={3}
      />

      {showAns && (
        <div className="mt-3">
          {ok ? (
            <div className="text-emerald-400">✅ Correct</div>
          ) : (
            <div className="text-rose-400">
              ❌ Not quite — check the differences below.
            </div>
          )}
        </div>
      )}

      {showAns && (
        <div className="mt-4">
          <DiffLine user={val} answer={seg.text} />
        </div>
      )}

      {/* Subtle hint bar */}
      <div className="mt-3 text-xs opacity-60">
        Tip: Matching ignores case, punctuation and extra spaces.
        <span className="ml-1 opacity-60">
          ({normalize(seg.text).split(" ").length} words)
        </span>
      </div>
    </div>
  );
}
