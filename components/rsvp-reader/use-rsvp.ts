"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

export type RsvpMode = "words" | "sentences";

export interface RsvpState {
  // parsed units
  words: string[];
  sentences: string[];
  // current position (word index)
  currentWordIndex: number;
  // playback
  isPlaying: boolean;
  speed: number; // advances per second
  mode: RsvpMode;
  chunkSize: number; // n words or n sentences
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Split text into words (punctuation stays attached to adjacent word).
 * Splits on whitespace and em-dashes (—) as separate words.
 */
export function parseWords(text: string): string[] {
  return text
    .trim()
    .split(/[\s—]+/) // split on whitespace or em-dash
    .filter(Boolean);
}

/**
 * Split text into sentences. Uses . ! ? as terminators.
 * Keeps trailing punctuation on the sentence.
 */
export function parseSentences(text: string): string[] {
  const raw = text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return raw.length > 0 ? raw : [text.trim()];
}

/**
 * Given a word index, return which sentence index that word belongs to.
 */
export function wordIndexToSentenceIndex(
  wordIndex: number,
  words: string[],
  sentences: string[]
): number {
  // count accumulated words per sentence
  let accumulated = 0;
  for (let si = 0; si < sentences.length; si++) {
    const sentenceWords = sentences[si].trim().split(/\s+/).filter(Boolean);
    accumulated += sentenceWords.length;
    if (wordIndex < accumulated) return si;
  }
  return sentences.length - 1;
}

/**
 * Given a sentence index, return the first word index of that sentence.
 */
export function sentenceIndexToWordIndex(
  sentenceIndex: number,
  sentences: string[]
): number {
  let idx = 0;
  for (let si = 0; si < sentenceIndex; si++) {
    idx += sentences[si].trim().split(/\s+/).filter(Boolean).length;
  }
  return idx;
}

/**
 * Returns pause multiplier for a word: 2.0 if word ends sentence (ends with . ! ?), else 1.0.
 */
export function getWordPauseFactor(word: string): number {
  return /[.!?]$/.test(word) ? 2.0 : 1.0;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useRsvp(text: string) {
  const words = parseWords(text);
  const sentences = parseSentences(text);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeedRaw] = useState(3); // advances per second
  const setSpeed = useCallback(
    (value: number | ((prev: number) => number)) => {
      setSpeedRaw((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        return Math.max(0.5, Math.min(10, parseFloat(next.toFixed(1))));
      });
    },
    []
  );
  const [mode, setMode] = useState<RsvpMode>("words");
  const [chunkSize, setChunkSize] = useState(1);

  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs so the scheduler closure always reads fresh values without
  // needing them in the dependency array (which would restart the loop).
  const isPlayingRef = useRef(false);
  const speedRef = useRef(3);
  const modeRef = useRef<RsvpMode>("words");
  const chunkSizeRef = useRef(1);
  const currentWordIndexRef = useRef(0);

  // Sync refs whenever state changes
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { chunkSizeRef.current = chunkSize; }, [chunkSize]);
  useEffect(() => { currentWordIndexRef.current = currentWordIndex; }, [currentWordIndex]);

  // reset position when text changes
  useEffect(() => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
  }, [text]);

  /**
   * Schedule the next advance using the pause factor of the CURRENT (about-to-leave) word/sentence,
   * then update the index. This ensures the extra pause is visible on the current item,
   * not on the next one.
   */
  const scheduleNext = useCallback(() => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);

    const currentIdx = currentWordIndexRef.current;
    const currentWords = parseWords(text);
    const currentSentences = parseSentences(text);
    const currentMode = modeRef.current;
    const currentChunkSize = chunkSizeRef.current;

    // Compute the pause factor for the item currently being displayed
    let pauseFactor = 1.0;
    if (currentMode === "words") {
      if (currentIdx < currentWords.length) {
        pauseFactor = getWordPauseFactor(currentWords[currentIdx]);
      }
    } else {
      const si = wordIndexToSentenceIndex(currentIdx, currentWords, currentSentences);
      const sentWords = currentSentences[si]?.trim().split(/\s+/).filter(Boolean) ?? [];
      if (sentWords.length > 0) {
        pauseFactor = getWordPauseFactor(sentWords[sentWords.length - 1]);
      }
    }

    const delay = (1000 / speedRef.current) * pauseFactor;

    pauseTimeoutRef.current = setTimeout(() => {
      if (!isPlayingRef.current) return;

      setCurrentWordIndex((prev) => {
        let next: number;
        if (currentMode === "words") {
          next = prev + currentChunkSize;
          if (next >= currentWords.length) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            return currentWords.length - 1;
          }
        } else {
          const si = wordIndexToSentenceIndex(prev, currentWords, currentSentences);
          const nextSi = si + currentChunkSize;
          if (nextSi >= currentSentences.length) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            return currentWords.length - 1;
          }
          next = sentenceIndexToWordIndex(nextSi, currentSentences);
        }
        currentWordIndexRef.current = next;
        return next;
      });

      // Schedule the next step after state update propagates
      if (isPlayingRef.current) {
        scheduleNext();
      }
    }, delay);
  }, [text]);

  // manage playback: start/stop the scheduler
  useEffect(() => {
    if (isPlaying) {
      isPlayingRef.current = true;
      scheduleNext();
    } else {
      isPlayingRef.current = false;
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    }
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [isPlaying, scheduleNext]);

  const play = () => {
    if (currentWordIndexRef.current >= words.length - 1) {
      currentWordIndexRef.current = 0;
      setCurrentWordIndex(0);
    }
    setIsPlaying(true);
  };
  const pause = () => {
    isPlayingRef.current = false;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setIsPlaying(false);
  };
  const togglePlay = () => (isPlaying ? pause() : play());

  const goTo = (wordIdx: number) => {
    const clamped = Math.max(0, Math.min(wordIdx, words.length - 1));
    currentWordIndexRef.current = clamped;
    setCurrentWordIndex(clamped);
  };

  const restart = () => {
    currentWordIndexRef.current = 0;
    setCurrentWordIndex(0);
    setIsPlaying(false);
  };

  // derived
  const currentSentenceIndex = text
    ? wordIndexToSentenceIndex(currentWordIndex, words, sentences)
    : 0;

  // current chunk to display (RSVP right panel)
  const currentChunk: string[] = (() => {
    if (!words.length) return [];
    if (mode === "words") {
      return words.slice(currentWordIndex, currentWordIndex + chunkSize);
    } else {
      // sentence mode
      return sentences.slice(
        currentSentenceIndex,
        currentSentenceIndex + chunkSize
      );
    }
  })();

  return {
    words,
    sentences,
    currentWordIndex,
    currentSentenceIndex,
    isPlaying,
    speed,
    setSpeed,
    mode,
    setMode,
    chunkSize,
    setChunkSize,
    currentChunk,
    togglePlay,
    play,
    pause,
    restart,
    goTo,
    progress:
      words.length > 0 ? (currentWordIndex / (words.length - 1)) * 100 : 0,
  };
}
