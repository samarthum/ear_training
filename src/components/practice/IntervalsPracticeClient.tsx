"use client";
import { useEffect, useRef, useState } from "react";
import { ensureAudioReady, playContext, playInterval, cleanupAudio } from "@/lib/audio/transport";
import { buildIntervalPrompt, INTERVAL_CHOICES, isCorrectInterval, type IntervalLabel } from "@/lib/theory/intervals";
import type { IntervalPrompt } from "@/types/drills";
import { PracticeInterface } from "@/components/app/PracticeInterface";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function IntervalsPracticeClient({ drillId }: { drillId: string }) {
  const [audioReady, setAudioReady] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [pending, setPending] = useState<IntervalPrompt | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  // Sessionized UX state
  const [plannedQuestions, setPlannedQuestions] = useState<number>(10);
  const [completed, setCompleted] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalLatencyMs, setTotalLatencyMs] = useState<number>(0);
  const sessionDone = plannedQuestions > 0 && completed >= plannedQuestions;

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const resetSession = () => {
    setCompleted(0);
    setCorrectCount(0);
    setTotalLatencyMs(0);
    setFeedback(null);
    startedAtRef.current = null;
  };

  const startPractice = async () => {
    if (sessionDone) {
      resetSession();
    }
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
        startedAtRef.current = performance.now();
      }, 900);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const onAnswer = async (label: string) => {
    if (!pending || isPlaying || sessionDone) return;
    const correct = isCorrectInterval(pending, label as IntervalLabel);
    setFeedback(correct ? "✅ Correct!" : "❌ Try again");

    // POST attempt
    try {
      const latencyMs = startedAtRef.current ? Math.max(0, Math.round(performance.now() - startedAtRef.current)) : 0;
      const nextCompleted = completed + 1;
      if (correct) setCorrectCount((c) => c + 1);
      setCompleted(nextCompleted);
      setTotalLatencyMs((t) => t + latencyMs);
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillId,
          prompt: pending,
          answer: { selection: label },
          isCorrect: correct,
          latencyMs,
        }),
      });
    } catch (err) {
      console.error("Failed to post attempt", err);
    }

    setTimeout(() => {
      setFeedback(null);
      // Only advance if correct and session not yet complete
      if (correct && completed + 1 < plannedQuestions) {
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

  const accuracy = completed > 0 ? Math.round((correctCount / completed) * 100) : 0;
  const avgLatency = completed > 0 ? Math.round(totalLatencyMs / completed) : 0;

  return (
    <PracticeInterface
      title="Interval Training"
      description="Listen to the tonal context (drone + I chord), then identify the interval you hear. All intervals are presented in major key context."
      onStart={startPractice}
      onReplay={replayAudio}
      isPlaying={isPlaying}
      isLoading={audioLoading}
      feedback={feedback}
      hasStarted={!!pending && !sessionDone}
      currentInfo={pending ? `${pending.direction === "asc" ? "Ascending" : pending.direction === "desc" ? "Descending" : "Harmonic"} interval in ${pending.key} major` : undefined}
    >
      {/* Session controls and progress */}
      <div className="space-y-4 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[color:var(--brand-muted)]">Session length</span>
            <Select
              value={String(plannedQuestions)}
              onValueChange={(v) => setPlannedQuestions(Number(v))}
              disabled={!!pending && !sessionDone}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-[color:var(--brand-muted)]">
            {completed} / {plannedQuestions}
          </div>
        </div>
        <Progress value={plannedQuestions ? Math.min(100, Math.round((completed / plannedQuestions) * 100)) : 0} />
      </div>

      {/* End-of-session summary */}
      {sessionDone && (
        <div className="rounded-lg border border-[color:var(--brand-line)] p-4 bg-[color:var(--brand-panel)] mb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">Session complete</div>
            <div className="text-sm">Score: {correctCount} / {plannedQuestions} ({accuracy}%)</div>
            <div className="text-sm">Avg latency: {avgLatency} ms</div>
            <Button variant="brand" onClick={startPractice}>Start new session</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {INTERVAL_CHOICES.map((opt) => (
          <Button
            key={opt.value}
            variant="brand"
            disabled={!pending || isPlaying || sessionDone}
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


