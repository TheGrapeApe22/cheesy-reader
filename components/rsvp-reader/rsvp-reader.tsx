"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TextPanel, DEFAULT_TEXT } from "./text-panel";
import { RsvpPanel } from "./rsvp-panel";
import { useRsvp } from "./use-rsvp";
import { ZoomControls } from "./zoom-controls";

// ─── Keyboard bindings ─────────────────────────────────────────────────────
// Space  → play/pause
// →      → advance one chunk
// ←      → go back one chunk
// R      → restart
// ───────────────────────────────────────────────────────────────────────────

const MIN_PANEL_PCT = 15; // minimum width % for each panel

export function RsvpReader() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [leftFontSize, setLeftFontSize] = useState(15);
  const [rightFontSize, setRightFontSize] = useState(28);
  const [splitPct, setSplitPct] = useState(45); // left panel % of total width

  const rsvp = useRsvp(text);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // ── Keyboard bindings ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === " ") {
        e.preventDefault();
        rsvp.togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        rsvp.goTo(
          Math.min(
            rsvp.currentWordIndex + rsvp.chunkSize,
            rsvp.words.length - 1
          )
        );
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        rsvp.goTo(Math.max(rsvp.currentWordIndex - rsvp.chunkSize, 0));
      } else if (e.key === "r" || e.key === "R") {
        rsvp.restart();
      } else if (e.key === "a" || e.key === "A") {
        rsvp.setSpeed((s) => Math.max(0.5, parseFloat((s - 0.5).toFixed(1))));
      } else if (e.key === "d" || e.key === "D") {
        rsvp.setSpeed((s) => Math.min(10, parseFloat((s + 0.5).toFixed(1))));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [rsvp]);

  // ── Resizable divider ──────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMove = (me: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((me.clientX - rect.left) / rect.width) * 100;
      setSplitPct(
        Math.max(MIN_PANEL_PCT, Math.min(100 - MIN_PANEL_PCT, pct))
      );
    };

    const onUp = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;

    const onMove = (te: TouchEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct =
        ((te.touches[0].clientX - rect.left) / rect.width) * 100;
      setSplitPct(
        Math.max(MIN_PANEL_PCT, Math.min(100 - MIN_PANEL_PCT, pct))
      );
    };
    const onEnd = () => {
      isDragging.current = false;
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <span className="font-mono text-primary font-bold tracking-tight text-sm">
            RSVP
          </span>
          <span className="text-muted-foreground text-xs">Reader</span>
        </div>
        <div className="flex items-center gap-4">
          <ZoomControls
            label="Text"
            value={leftFontSize}
            onChange={setLeftFontSize}
          />
          <ZoomControls
            label="RSVP"
            value={rightFontSize}
            onChange={setRightFontSize}
          />
          <span className="text-xs text-muted-foreground font-mono hidden sm:block">
            Space=play · ←→=step · A/D=speed · R=restart
          </span>
        </div>
      </header>

      {/* Split pane */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel */}
        <div
          className="min-w-0 overflow-hidden border-r border-border"
          style={{ width: `${splitPct}%` }}
        >
          <TextPanel
            text={text}
            onTextChange={setText}
            currentWordIndex={rsvp.currentWordIndex}
            currentSentenceIndex={rsvp.currentSentenceIndex}
            words={rsvp.words}
            sentences={rsvp.sentences}
            fontSize={leftFontSize}
            onGoTo={rsvp.goTo}
          />
        </div>

        {/* Divider */}
        <div
          role="separator"
          aria-label="Resize panels"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          className={cn(
            "w-1.5 shrink-0 flex items-center justify-center cursor-col-resize",
            "bg-border hover:bg-primary transition-colors group relative select-none"
          )}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" /> {/* hit-area */}
          <div className="h-8 w-0.5 bg-muted-foreground/40 group-hover:bg-primary rounded-full" />
        </div>

        {/* Right panel */}
        <div
          className="flex-1 min-w-0 overflow-hidden"
          onWheel={(e) => {
            e.preventDefault();
            setRightFontSize((prev) =>
              Math.max(10, Math.min(96, prev + (e.deltaY < 0 ? 2 : -2)))
            );
          }}
        >
          <RsvpPanel
            currentChunk={rsvp.currentChunk}
            mode={rsvp.mode}
            setMode={rsvp.setMode}
            chunkSize={rsvp.chunkSize}
            setChunkSize={rsvp.setChunkSize}
            speed={rsvp.speed}
            setSpeed={rsvp.setSpeed}
            isPlaying={rsvp.isPlaying}
            togglePlay={rsvp.togglePlay}
            restart={rsvp.restart}
            progress={rsvp.progress}
            fontSize={rightFontSize}
            wordsCount={rsvp.words.length}
            currentWordIndex={rsvp.currentWordIndex}
          />
        </div>
      </div>
    </div>
  );
}
