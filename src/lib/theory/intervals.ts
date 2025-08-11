import type { IntervalPrompt } from "@/types/drills";

const INTERVALS = [
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "TT",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
  "P8",
] as const;

const DIRECTIONS = ["asc", "desc", "harm"] as const;

export type IntervalLabel = (typeof INTERVALS)[number];

const intervalToTonal: Record<IntervalLabel, string> = {
  m2: "2m",
  M2: "2M",
  m3: "3m",
  M3: "3M",
  P4: "4P",
  TT: "4A",
  P5: "5P",
  m6: "6m",
  M6: "6M",
  m7: "7m",
  M7: "7M",
  P8: "8P",
};

const KEYS = ["C", "D", "E", "F", "G", "A", "B"] as const;

export function buildIntervalPrompt(key?: string): IntervalPrompt {
  const selectedKey = key || KEYS[Math.floor(Math.random() * KEYS.length)];
  const label = INTERVALS[Math.floor(Math.random() * INTERVALS.length)];
  const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
  
  return {
    kind: "INTERVAL",
    key: selectedKey,
    mode: "major",
    interval: intervalToTonal[label],
    direction,
  };
}

export function isCorrectInterval(prompt: IntervalPrompt, answer: IntervalLabel): boolean {
  return intervalToTonal[answer] === prompt.interval;
}

export const INTERVAL_CHOICES: { label: IntervalLabel; value: string }[] = Object.entries(
  intervalToTonal
).map(([label, value]) => ({ label: label as IntervalLabel, value }));


