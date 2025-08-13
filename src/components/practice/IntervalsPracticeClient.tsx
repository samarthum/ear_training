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
  type Phase = "IDLE" | "RUNNING" | "REVIEW";
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [plannedQuestions, setPlannedQuestions] = useState<number>(10);
  const [completed, setCompleted] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const sessionDone = plannedQuestions > 0 && completed >= plannedQuestions;

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  const resetSession = () => {
    setCompleted(0);
    setCorrectCount(0);
    setFeedback(null);
    startedAtRef.current = null;
    setPending(null);
    setPhase("IDLE");
  };

  const startPractice = async () => {
    if (sessionDone || phase === "REVIEW") {
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
    setPhase("RUNNING");
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
    if (!pending || isPlaying || phase !== "RUNNING") return;
    const correct = isCorrectInterval(pending, label as IntervalLabel);
    setFeedback(correct ? "✅ Correct!" : "❌ Try again");

    // POST attempt
    try {
      const latencyMs = startedAtRef.current ? Math.max(0, Math.round(performance.now() - startedAtRef.current)) : 0;
      if (correct) {
        setCorrectCount((c) => c + 1);
        setCompleted((n) => n + 1);
      }
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
      const nextCount = correct ? completed + 1 : completed;
      if (correct && nextCount < plannedQuestions) {
        nextPrompt();
      } else if (correct && nextCount >= plannedQuestions) {
        setPhase("REVIEW");
        setPending(null);
      }
    }, 1200);
  };

  const giveUp = async () => {
    if (!pending || isPlaying || phase !== "RUNNING") return;
    const latencyMs = startedAtRef.current ? Math.max(0, Math.round(performance.now() - startedAtRef.current)) : 0;

    try {
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drillId,
          prompt: pending,
          answer: { skipped: true },
          isCorrect: false,
          latencyMs,
        }),
      });
    } catch (err) {
      console.error("Failed to post skipped attempt", err);
    }

    setCompleted((n) => n + 1);

    const correctLabel = INTERVAL_CHOICES.find((c) => c.value === pending.interval)?.label || pending.interval;
    setFeedback(`Answer: ${correctLabel}`);
    setTimeout(() => {
      setFeedback(null);
      const nextCount = completed + 1;
      if (nextCount < plannedQuestions) {
        nextPrompt();
      } else {
        setPhase("REVIEW");
        setPending(null);
      }
    }, 1400);
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

  return (
    <PracticeInterface
      title="Interval Training"
      description="Listen to the tonal context (drone + I chord), then identify the interval you hear. All intervals are presented in major key context."
      onStart={startPractice}
      onReplay={replayAudio}
      isPlaying={isPlaying}
      isLoading={audioLoading}
      feedback={feedback}
      hasStarted={phase === "RUNNING"}
      currentInfo={phase === "RUNNING" && pending ? `${pending.direction === "asc" ? "Ascending" : pending.direction === "desc" ? "Descending" : "Harmonic"} interval in ${pending.key} major` : undefined}
    >
      {/* Idle: settings only */}
      {phase === "IDLE" && (
        <div className="space-y-4 mb-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[color:var(--brand-muted)]">Session length</span>
            <Select
              value={String(plannedQuestions)}
              onValueChange={(v) => setPlannedQuestions(Number(v))}
              disabled={phase !== "IDLE"}
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
        </div>
      )}

      {/* Running: progress and prompt controls */}
      {phase === "RUNNING" && (
        <div className="space-y-4 mb-2">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-[color:var(--brand-muted)]">
              {completed} / {plannedQuestions}
            </div>
          </div>
          <Progress value={plannedQuestions ? Math.min(100, Math.round((completed / plannedQuestions) * 100)) : 0} />
        </div>
      )}

      {/* Prompt controls */}
      {phase === "RUNNING" && (
        <div className="flex items-center justify-end mb-2">
          <Button variant="secondary" disabled={!pending || isPlaying || phase !== "RUNNING"} onClick={giveUp}>
            Reveal answer
          </Button>
        </div>
      )}

      {/* End-of-session summary */}
      {phase === "REVIEW" && (
        <div className="rounded-lg border border-[color:var(--brand-line)] p-4 bg-[color:var(--brand-panel)] mb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">Session complete</div>
            <div className="text-sm">Score: {correctCount} / {plannedQuestions} ({accuracy}%)</div>
            <Button variant="brand" onClick={startPractice}>Start new session</Button>
          </div>
        </div>
      )}

      {phase === "RUNNING" && (
        <div className="grid grid-cols-4 gap-3">
          {INTERVAL_CHOICES.map((opt) => (
            <Button
              key={opt.value}
              variant="brand"
              disabled={!pending || isPlaying || phase !== "RUNNING"}
              className="aspect-square text-lg font-semibold hover:scale-105 transition-transform"
              onClick={() => onAnswer(opt.label)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}
    </PracticeInterface>
  );
}


