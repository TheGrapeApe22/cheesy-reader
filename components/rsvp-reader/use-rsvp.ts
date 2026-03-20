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
  const [lastWordPauseFactor, setLastWordPauseFactor] = useState(1.0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reset position when text changes
  useEffect(() => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
  }, [text]);

  const advance = useCallback(() => {
    setCurrentWordIndex((prev) => {
      let next: number;
      if (mode === "words") {
        next = prev + chunkSize;
        if (next >= words.length) {
          setIsPlaying(false);
          return words.length - 1;
        }
      } else {
        // sentence mode: advance by chunkSize sentences
        const currentSentence = wordIndexToSentenceIndex(prev, words, sentences);
        const nextSentence = currentSentence + chunkSize;
        if (nextSentence >= sentences.length) {
          setIsPlaying(false);
          return words.length - 1;
        }
        next = sentenceIndexToWordIndex(nextSentence, sentences);
      }

      // Check if current (or last) word ends a sentence
      if (mode === "words" && prev < words.length) {
        const pauseFactor = getWordPauseFactor(words[prev]);
        setLastWordPauseFactor(pauseFactor);
      }

      return next;
    });
  }, [mode, chunkSize, words, sentences]);

  // manage interval with pause factor applied to current word
  useEffect(() => {
    if (isPlaying) {
      const baseMsPerWord = 1000 / speed;
      const actualMs = baseMsPerWord * lastWordPauseFactor;
      pauseTimeoutRef.current = setTimeout(() => {
        advance();
      }, actualMs);
    } else {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    }
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [isPlaying, speed, advance, lastWordPauseFactor]);

  const play = () => {
    if (currentWordIndex >= words.length - 1) setCurrentWordIndex(0);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setIsPlaying(true);
  };
  const pause = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setIsPlaying(false);
  };
  const togglePlay = () => (isPlaying ? pause() : play());

  const goTo = (wordIdx: number) => {
    setCurrentWordIndex(Math.max(0, Math.min(wordIdx, words.length - 1)));
  };

  const restart = () => {
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
