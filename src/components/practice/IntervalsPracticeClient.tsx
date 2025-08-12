"use client";
import { useEffect, useState } from "react";
import { ensureAudioReady, playContext, playInterval, cleanupAudio } from "@/lib/audio/transport";
import { buildIntervalPrompt, INTERVAL_CHOICES, isCorrectInterval, type IntervalLabel } from "@/lib/theory/intervals";
import type { IntervalPrompt } from "@/types/drills";
import { PracticeInterface } from "@/components/app/PracticeInterface";
import { Button } from "@/components/ui/button";

export default function IntervalsPracticeClient() {
  const [audioReady, setAudioReady] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [pending, setPending] = useState<IntervalPrompt | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const startPractice = async () => {
    if (!audioReady) {
      try {
        setAudioLoading(true);
        await ensureAudioReady();
        setAudioReady(true);
      } catch (error) {
        console.error("Failed to start audio:", error);
        setAudioLoading(false);
        return;
      }
      setAudioLoading(false);
    }
    nextPrompt();
  };

  const nextPrompt = async () => {
    const p = buildIntervalPrompt();
    setPending(p);
    setIsPlaying(true);

    try {
      await playContext(p.key);
      setTimeout(async () => {
        await playInterval({ key: p.key, interval: p.interval, direction: p.direction });
        setIsPlaying(false);
      }, 900);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const onAnswer = async (label: string) => {
    if (!pending || isPlaying) return;
    const correct = isCorrectInterval(pending, label as IntervalLabel);
    setFeedback(correct ? "✅ Correct!" : "❌ Try again");
    setTimeout(() => {
      setFeedback(null);
      if (correct) {
        nextPrompt();
      }
    }, 1200);
  };

  const replayAudio = async () => {
    if (!pending || !audioReady || isPlaying) return;
    setIsPlaying(true);

    try {
      await playContext(pending.key);
      setTimeout(async () => {
        await playInterval({ 
          key: pending.key, 
          interval: pending.interval, 
          direction: pending.direction 
        });
        setIsPlaying(false);
      }, 900);
    } catch (error) {
      console.error("Error replaying audio:", error);
      setIsPlaying(false);
    }
  };

  return (
    <PracticeInterface
      title="Interval Training"
      description="Listen to the tonal context (drone + I chord), then identify the interval you hear. All intervals are presented in major key context."
      onStart={startPractice}
      onReplay={replayAudio}
      isPlaying={isPlaying}
      isLoading={audioLoading}
      feedback={feedback}
      hasStarted={!!pending}
      currentInfo={pending ? `${pending.direction === "asc" ? "Ascending" : pending.direction === "desc" ? "Descending" : "Harmonic"} interval in ${pending.key} major` : undefined}
    >
      <div className="grid grid-cols-4 gap-3">
        {INTERVAL_CHOICES.map((opt) => (
          <Button
            key={opt.value}
            variant="brand"
            disabled={!pending || isPlaying}
            className="aspect-square text-lg font-semibold hover:scale-105 transition-transform"
            onClick={() => onAnswer(opt.label)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </PracticeInterface>
  );
}


