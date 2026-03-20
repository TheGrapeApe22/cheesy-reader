"use client";

import { cn } from "@/lib/utils";
import type { RsvpMode } from "./use-rsvp";

interface RsvpPanelProps {
  currentChunk: string[];
  mode: RsvpMode;
  setMode: (m: RsvpMode) => void;
  chunkSize: number;
  setChunkSize: (n: number) => void;
  speed: number;
  setSpeed: (s: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  restart: () => void;
  progress: number;
  fontSize: number;
  wordsCount: number;
  currentWordIndex: number;
}

export function RsvpPanel({
  currentChunk,
  mode,
  setMode,
  chunkSize,
  setChunkSize,
  speed,
  setSpeed,
  isPlaying,
  togglePlay,
  restart,
  progress,
  fontSize,
  wordsCount,
  currentWordIndex,
}: RsvpPanelProps) {
  const displayText = currentChunk.join(" ");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          RSVP
        </span>

        {/* Mode toggle */}
        <div className="flex rounded overflow-hidden border border-border ml-auto">
          {(["words", "sentences"] as RsvpMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 py-0.5 text-xs transition-colors capitalize",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Chunk size */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">n =</span>
          <button
            onClick={() => setChunkSize(Math.max(1, chunkSize - 1))}
            className="w-5 h-5 flex items-center justify-center rounded border border-border text-foreground hover:bg-secondary transition-colors text-xs"
          >
            –
          </button>
          <span className="w-5 text-center text-sm font-mono text-foreground">
            {chunkSize}
          </span>
          <button
            onClick={() => setChunkSize(Math.min(10, chunkSize + 1))}
            className="w-5 h-5 flex items-center justify-center rounded border border-border text-foreground hover:bg-secondary transition-colors text-xs"
          >
            +
          </button>
        </div>
      </div>

      {/* Main display */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <p
          className="text-center font-sans font-medium leading-relaxed text-balance text-foreground max-w-prose"
          style={{ fontSize: fontSize * 1.5 }}
        >
          {displayText || (
            <span className="text-muted-foreground italic text-base">
              Press play to begin…
            </span>
          )}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-1 shrink-0">
        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground font-mono">
            {currentWordIndex + 1} / {wordsCount}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 px-4 py-3 border-t border-border shrink-0">
        {/* Playback buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={restart}
            aria-label="Restart"
            className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {/* Restart icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-lg"
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* spacer to balance layout */}
          <div className="w-9 h-9" />
        </div>

        {/* Speed slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-8 shrink-0 font-mono">0.5×</span>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Speed"
          />
          <span className="text-xs text-muted-foreground w-8 text-right shrink-0 font-mono">10×</span>
          <span className="text-xs font-mono text-primary w-10 text-right shrink-0">
            {speed}×/s
          </span>
        </div>
      </div>
    </div>
  );
}
