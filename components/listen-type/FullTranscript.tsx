"use client";
import AudioPlayer from "./AudioPlayer";
import { useConcatenatedAudio } from "@/hooks/useConcatenatedAudio";

// Utility function to format transcript with speaker labels and line breaks
const formatTranscriptWithSpeakers = (transcript: string): string => {
  if (!transcript) return "";

  // Split by sentences (ending with . ! ?)
  const sentences = transcript.split(/(?<=[.!?])\s+/);

  // Group sentences into speaker turns (every 2-3 sentences per speaker)
  const speakerTurns: string[] = [];
  let currentTurn = "";
  let sentenceCount = 0;
  let speakerIndex = 0;

  for (const sentence of sentences) {
    if (sentence.trim()) {
      currentTurn += sentence.trim() + " ";
      sentenceCount++;

      // Switch speaker after 2-3 sentences or at natural breaks
      if (
        sentenceCount >= 2 &&
        (sentence.includes(".") ||
          sentence.includes("!") ||
          sentence.includes("?"))
      ) {
        const speakerLabel = speakerIndex % 2 === 0 ? "Person A" : "Person B";
        speakerTurns.push(`${speakerLabel}: ${currentTurn.trim()}`);
        currentTurn = "";
        sentenceCount = 0;
        speakerIndex++;
      }
    }
  }

  // Add remaining sentences
  if (currentTurn.trim()) {
    const speakerLabel = speakerIndex % 2 === 0 ? "Person A" : "Person B";
    speakerTurns.push(`${speakerLabel}: ${currentTurn.trim()}`);
  }

  return speakerTurns.join("\n\n");
};

export default function FullTranscript({
  fullTranscript,
  slug,
}: {
  title: string;
  fullTranscript?: string;
  slug: string;
}) {
  const {
    concatenatedAudio,
    isLoading,
    error,
    currentSegmentIndex,
    isPlaying,
    playConcatenatedAudio,
    pauseConcatenatedAudio,
    handleSegmentReady,
    playSegmentByIndex,
  } = useConcatenatedAudio(slug);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSegmentChange = (_segmentIndex: number) => {
    // This will be handled by the VideoPlayer component
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-4">Error Loading Audio</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      {/* Audio Only Mode */}
      {concatenatedAudio && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={
                isPlaying ? pauseConcatenatedAudio : playConcatenatedAudio
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? "Pause" : "Play"} Full Conversation
            </button>
          </div>

          {/* Hidden audio players for each segment */}
          <div className="hidden">
            {concatenatedAudio.audioSegments.map((segment, index) => (
              <AudioPlayer
                key={segment.order}
                src={segment.audioUrl}
                audioFileId={segment.audioFileId}
                startMs={segment.startMs}
                endMs={segment.endMs}
                onReady={(audio) => handleSegmentReady(audio, index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Combined Interactive Transcript */}
      {fullTranscript &&
      concatenatedAudio &&
      concatenatedAudio.audioSegments.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-muted/30 to-muted/60 dark:from-muted/20 dark:to-muted/40 rounded-xl p-6 border border-border/50 shadow-sm">
            <div className="space-y-4">
              {formatTranscriptWithSpeakers(fullTranscript)
                .split("\n\n")
                .map((speakerTurn, index) => {
                  const [speaker, ...contentParts] = speakerTurn.split(": ");
                  const content = contentParts.join(": ");
                  const isPersonA = speaker === "Person A";

                  // Find corresponding audio segment
                  const correspondingSegment =
                    concatenatedAudio.audioSegments.find((segment) =>
                      segment.text.includes(
                        content.split(" ").slice(0, 3).join(" ")
                      )
                    );
                  const segmentIndex = correspondingSegment
                    ? concatenatedAudio.audioSegments.indexOf(
                        correspondingSegment
                      )
                    : Math.min(
                        index,
                        concatenatedAudio.audioSegments.length - 1
                      );

                  const isCurrentlyPlaying =
                    segmentIndex === currentSegmentIndex && isPlaying;

                  return (
                    <div
                      key={index}
                      className={`flex gap-3 p-4 rounded-lg transition-all duration-200 cursor-pointer group ${
                        isPersonA
                          ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-400 dark:border-blue-500"
                          : "bg-emerald-50/50 dark:bg-emerald-900/10 border-l-4 border-emerald-400 dark:border-emerald-500"
                      } ${
                        isCurrentlyPlaying
                          ? "ring-2 ring-primary/50 shadow-lg scale-[1.02]"
                          : "hover:shadow-md hover:scale-[1.01]"
                      }`}
                      onClick={() => {
                        if (segmentIndex >= 0) {
                          playSegmentByIndex(segmentIndex, { single: true });
                        }
                      }}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          isPersonA
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300"
                            : "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300"
                        } ${isCurrentlyPlaying ? "animate-pulse" : ""}`}
                      >
                        {isPersonA ? "A" : "B"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div
                            className={`text-sm font-medium ${
                              isPersonA
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {speaker}
                          </div>
                          <div className="flex items-center gap-2">
                            {isCurrentlyPlaying && (
                              <div className="flex items-center gap-1 text-xs text-primary">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <span>Playing</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap group-hover:text-foreground/90">
                          {content}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : fullTranscript ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">
            Full Transcript:
          </h3>
          <div className="bg-gradient-to-br from-muted/30 to-muted/60 dark:from-muted/20 dark:to-muted/40 rounded-xl p-6 border border-border/50 shadow-sm">
            <div className="space-y-4">
              {formatTranscriptWithSpeakers(fullTranscript)
                .split("\n\n")
                .map((speakerTurn, index) => {
                  const [speaker, ...contentParts] = speakerTurn.split(": ");
                  const content = contentParts.join(": ");
                  const isPersonA = speaker === "Person A";

                  return (
                    <div
                      key={index}
                      className={`flex gap-3 p-4 rounded-lg transition-all duration-200 hover:shadow-sm ${
                        isPersonA
                          ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-400 dark:border-blue-500"
                          : "bg-emerald-50/50 dark:bg-emerald-900/10 border-l-4 border-emerald-400 dark:border-emerald-500"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          isPersonA
                            ? "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300"
                            : "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {isPersonA ? "A" : "B"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isPersonA
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {speaker}
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {content}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-lg">No transcript available</p>
        </div>
      )}
    </div>
  );
}
