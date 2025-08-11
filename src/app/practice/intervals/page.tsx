"use client";
import { useEffect, useMemo, useState } from "react";
import { ensureAudioReady, playContext, playInterval, cleanupAudio } from "@/lib/audio/transport";
import { buildIntervalPrompt, INTERVAL_CHOICES, isCorrectInterval } from "@/lib/theory/intervals";
import type { IntervalPrompt } from "@/types/drills";

export default function IntervalsPracticePage() {
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState<IntervalPrompt | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    ensureAudioReady().then(() => setReady(true));
    return () => {
      cleanupAudio();
    };
  }, []);

  const nextPrompt = useMemo(() => () => {
    const p = buildIntervalPrompt("C");
    setPending(p);
    // Play after small delay so UI updates first
    setTimeout(async () => {
      await playContext(p.key);
      await playInterval({ key: p.key, interval: p.interval, direction: p.direction });
    }, 100);
  }, []);

  const onAnswer = async (label: string) => {
    if (!pending) return;
    const correct = isCorrectInterval(pending, label as any);
    setFeedback(correct ? "Correct" : "Try again");
    setTimeout(() => setFeedback(null), 800);
    nextPrompt();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Interval Training (C major)</h1>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => nextPrompt()}
          disabled={!ready}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {pending ? "Replay / Next" : "Start"}
        </button>
        {feedback && <span className="text-sm text-muted-foreground">{feedback}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {INTERVAL_CHOICES.map((opt) => (
          <button
            key={opt.value}
            className="border rounded-md p-3 hover:bg-gray-50"
            onClick={() => onAnswer(opt.label)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}


