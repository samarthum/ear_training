"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "all";

interface TimeframeToggleProps {
  value: Range;
  onChange: (value: Range) => void;
  className?: string;
}

export function TimeframeToggle({ value, onChange, className }: TimeframeToggleProps) {
  const options: Array<{ key: Range; label: string }> = [
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "all", label: "All" },
  ];

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full border border-[color:var(--brand-line)] bg-[color:var(--brand-panel)] p-1", className)} role="tablist" aria-label="Timeframe">
      {options.map((opt) => (
        <button
          key={opt.key}
          role="tab"
          aria-selected={value === opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm",
            value === opt.key
              ? "bg-[color:var(--brand-accent)] text-white"
              : "text-[color:var(--brand-muted)] hover:text-[color:var(--brand-text)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}


