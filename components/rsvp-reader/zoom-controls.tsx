"use client";

interface ZoomControlsProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function ZoomControls({
  label,
  value,
  onChange,
  min = 10,
  max = 48,
  step = 2,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground font-mono">{label}</span>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label={`Decrease ${label} font size`}
        className="w-5 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs"
      >
        A
      </button>
      <span className="text-xs font-mono text-muted-foreground w-6 text-center">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label={`Increase ${label} font size`}
        className="w-5 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm font-bold"
      >
        A
      </button>
    </div>
  );
}
