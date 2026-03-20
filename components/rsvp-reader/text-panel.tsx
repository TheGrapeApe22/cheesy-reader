"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Highlight colour tokens (edit here) ───────────────────────────────────
const SENTENCE_BG = "var(--highlight-sentence)";      // sentence highlight
const SENTENCE_TEXT = "var(--highlight-sentence-text)";
const WORD_BG = "var(--highlight-word)";              // word highlight
const WORD_TEXT = "var(--highlight-word-text)";
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_TEXT = `The quick brown fox jumps over the lazy dog. A fast red plane flew past the old blue tower. In the morning, birds begin to sing their melodies. Science tells us that the universe is approximately 13.8 billion years old. Reading faster helps you absorb more information in less time. The secret to speed reading lies in training your brain to process chunks of text simultaneously. Practice every day and you will see remarkable improvements. Focus is the foundation of all great achievements. Every journey begins with a single step forward into the unknown.`;

interface TextPanelProps {
  text: string;
  onTextChange: (t: string) => void;
  currentWordIndex: number;
  currentSentenceIndex: number;
  words: string[];
  sentences: string[];
  fontSize: number;
  onGoTo?: (wordIdx: number) => void;
}

export function TextPanel({
  text,
  onTextChange,
  currentWordIndex,
  currentSentenceIndex,
  words,
  sentences,
  fontSize,
  onGoTo,
}: TextPanelProps) {
  const [isEditing, setIsEditing] = useState(!text || text === DEFAULT_TEXT);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);

  // Build word spans with highlight info
  const sentenceWordRanges: { start: number; end: number }[] = [];
  let acc = 0;
  for (const sentence of sentences) {
    const sw = sentence.trim().split(/\s+/).filter(Boolean).length;
    sentenceWordRanges.push({ start: acc, end: acc + sw - 1 });
    acc += sw;
  }

  const inCurrentSentence = (idx: number) => {
    const range = sentenceWordRanges[currentSentenceIndex];
    return range ? idx >= range.start && idx <= range.end : false;
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Text
        </span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className={cn(
              "px-2 py-0.5 text-xs rounded transition-colors",
              isEditing
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Edit
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className={cn(
              "px-2 py-0.5 text-xs rounded transition-colors",
              !isEditing
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Read
          </button>
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="flex-1 w-full resize-none bg-transparent text-foreground p-4 outline-none font-sans leading-relaxed placeholder:text-muted-foreground"
          placeholder="Paste or type any text here…"
          style={{ fontSize }}
          spellCheck={false}
        />
      ) : (
        <div
          ref={renderRef}
          className="flex-1 overflow-y-auto p-4 leading-relaxed select-none"
          style={{ fontSize }}
        >
          {words.map((word, idx) => {
            const isSentence = inCurrentSentence(idx);
            const isWord = idx === currentWordIndex;
            return (
              <span key={idx}>
                <span
                  onClick={() => onGoTo?.(idx)}
                  style={{
                    backgroundColor: isWord
                      ? WORD_BG
                      : isSentence
                      ? SENTENCE_BG
                      : undefined,
                    color: isWord
                      ? WORD_TEXT
                      : isSentence
                      ? SENTENCE_TEXT
                      : undefined,
                    borderRadius: "3px",
                    padding: isWord || isSentence ? "0 2px" : undefined,
                    cursor: "pointer",
                    transition: "background-color 0.1s ease",
                  }}
                >
                  {word}
                </span>
                {" "}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { DEFAULT_TEXT };
