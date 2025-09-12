import { useState, useEffect, useRef } from "react";

interface AudioSegment {
    order: number;
    text: string;
    audioUrl?: string;
    cloudinaryUrl?: string; // Cloudinary URL for the segment
    cloudinaryPublicId?: string; // Cloudinary public ID for the segment
    audioFileId?: string;
    startMs: number;
    endMs: number;
    duration: number;
}

interface ConcatenatedAudio {
    audioSegments: AudioSegment[];
    totalDuration: number;
    slug: string;
}

export const useConcatenatedAudio = (slug: string) => {
    const [concatenatedAudio, setConcatenatedAudio] =
        useState<ConcatenatedAudio | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);
    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const desiredIsPlayingRef = useRef(false);
    const playSingleSegmentModeRef = useRef(false);

    useEffect(() => {
        const fetchConcatenatedAudio = async () => {
            if (!slug) return;

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/listen-type/audio/concatenate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ slug }),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch concatenated audio");
                }

                const data = await response.json();
                setConcatenatedAudio(data);

                // Initialize audio refs array
                audioRefs.current = new Array(data.audioSegments.length).fill(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchConcatenatedAudio();
    }, [slug]);

    const playConcatenatedAudio = async () => {
        if (!concatenatedAudio) return;

        try {
            // Pause any other playing audios first to avoid overlap
            audioRefs.current.forEach((audio, index) => {
                if (audio && index !== currentSegmentIndex) {
                    audio.pause();
                }
            });

            desiredIsPlayingRef.current = true;
            playSingleSegmentModeRef.current = false;
            setIsPlaying(true);

            // Play from current segment
            if (audioRefs.current[currentSegmentIndex]) {
                await audioRefs.current[currentSegmentIndex]?.play();
            }
        } catch (err) {
            console.error("Error playing concatenated audio:", err);
            desiredIsPlayingRef.current = false;
            setIsPlaying(false);
        }
    };

    const pauseConcatenatedAudio = () => {
        desiredIsPlayingRef.current = false;
        playSingleSegmentModeRef.current = false;
        audioRefs.current.forEach((audio) => {
            if (audio) {
                audio.pause();
            }
        });
        setIsPlaying(false);
    };

    const handleSegmentEnd = (segmentIndex: number) => {
        // When a segment ends, start the next one
        const nextIndex = segmentIndex + 1;
        if (nextIndex < audioRefs.current.length) {
            setCurrentSegmentIndex(nextIndex);
            // If user clicked a single segment, stop at end
            if (playSingleSegmentModeRef.current) {
                desiredIsPlayingRef.current = false;
                playSingleSegmentModeRef.current = false;
                setIsPlaying(false);
                return;
            }
            // Seamless continue if user intended to keep playing
            if (desiredIsPlayingRef.current) {
                // Ensure only the next segment plays
                audioRefs.current.forEach((audio, index) => {
                    if (!audio) return;
                    if (index === nextIndex) return;
                    audio.pause();
                });
                audioRefs.current[nextIndex]?.play();
            }
        } else {
            // All segments finished
            desiredIsPlayingRef.current = false;
            playSingleSegmentModeRef.current = false;
            setIsPlaying(false);
            setCurrentSegmentIndex(0);
        }
    };

    const handleSegmentReady = (audio: HTMLAudioElement, index: number) => {
        audioRefs.current[index] = audio;

        // Add event listeners for seamless playback
        audio.addEventListener("ended", () => handleSegmentEnd(index));
        // Do not toggle global isPlaying on per-audio play/pause to avoid UI flicker.
    };

    const seekToTime = (timeMs: number) => {
        if (!concatenatedAudio) return;

        let accumulatedTime = 0;
        let targetSegmentIndex = 0;

        // Find which segment contains the target time
        for (let i = 0; i < concatenatedAudio.audioSegments.length; i++) {
            const segmentDuration = concatenatedAudio.audioSegments[i].duration;
            if (timeMs <= accumulatedTime + segmentDuration) {
                targetSegmentIndex = i;
                break;
            }
            accumulatedTime += segmentDuration;
        }

        // Calculate the time within the target segment
        const segmentStartTime = accumulatedTime;
        const timeInSegment = timeMs - segmentStartTime;

        // Set current segment and seek to the correct time
        setCurrentSegmentIndex(targetSegmentIndex);
        if (audioRefs.current[targetSegmentIndex]) {
            audioRefs.current[targetSegmentIndex]!.currentTime = timeInSegment / 1000;
        }

        // If user intends to be playing, start playback from this point
        if (desiredIsPlayingRef.current) {
            // Pause all other segments
            audioRefs.current.forEach((audio, index) => {
                if (audio && index !== targetSegmentIndex) {
                    audio.pause();
                }
            });
            audioRefs.current[targetSegmentIndex]?.play();
            setIsPlaying(true);
        }
    };

    const playFromMs = (timeMs: number) => {
        desiredIsPlayingRef.current = true;
        playSingleSegmentModeRef.current = false;
        seekToTime(timeMs);
    };

    const playSegmentByIndex = async (
        index: number,
        opts?: { single?: boolean }
    ) => {
        if (!concatenatedAudio) return;
        const target = concatenatedAudio.audioSegments[index];
        if (!target) return;

        // Pause all other segments first
        audioRefs.current.forEach((audio, i) => {
            if (audio && i !== index) {
                audio.pause();
            }
        });

        // Set the target segment as current
        setCurrentSegmentIndex(index);
        desiredIsPlayingRef.current = true;
        playSingleSegmentModeRef.current = !!opts?.single;

        // Play the specific segment
        try {
            if (audioRefs.current[index]) {
                // Reset to beginning of segment
                audioRefs.current[index]!.currentTime = 0;
                await audioRefs.current[index]?.play();
                setIsPlaying(true);
            }
        } catch (err) {
            console.error("Error playing segment:", err);
            desiredIsPlayingRef.current = false;
            playSingleSegmentModeRef.current = false;
            setIsPlaying(false);
        }
    };

    return {
        concatenatedAudio,
        isLoading,
        error,
        currentSegmentIndex,
        isPlaying,
        playConcatenatedAudio,
        pauseConcatenatedAudio,
        handleSegmentReady,
        seekToTime,
        playFromMs,
        playSegmentByIndex,
    };
};
