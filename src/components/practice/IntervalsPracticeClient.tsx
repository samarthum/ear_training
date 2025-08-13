"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { ensureAudioReady, playContext, playInterval, cleanupAudio } from "@/lib/audio/transport";
import { buildIntervalPrompt, INTERVAL_CHOICES, isCorrectInterval, KEYS, DIRECTIONS, type IntervalLabel } from "@/lib/theory/intervals";
import type { IntervalPrompt } from "@/types/drills";
import { PracticeInterface } from "@/components/app/PracticeInterface";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
  const [totalLatencyMs, setTotalLatencyMs] = useState<number>(0);
  const [sessionStats, setSessionStats] = useState<Partial<Record<IntervalLabel, { seen: number; correct: number }>>>({});

  // Settings (Idle only editable)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [keyMode, setKeyMode] = useState<"random" | "fixed">("random");
  const [fixedKey, setFixedKey] = useState<string>("C");
  const [directions, setDirections] = useState<string[]>(["asc", "desc", "harm"]);

  // Keyboard shortcuts mapping (12 intervals)
  const LABEL_ORDER: IntervalLabel[] = ["m2","M2","m3","M3","P4","TT","P5","m6","M6","m7","M7","P8"];
  const KEY_BINDINGS: string[] = ["1","2","3","4","5","6","7","8","9","0","q","w"];

  const displayLabel = (label: IntervalLabel): string => {
    if (label === "TT") return "Tritone (TT)";
    if (label === "P8") return "Octave (P8)";
    return label;
  };

  const GROUPS: { name: string; items: IntervalLabel[] }[] = useMemo(() => [
    { name: "2nds", items: ["m2", "M2"] },
    { name: "3rds", items: ["m3", "M3"] },
    { name: "4/TT/5", items: ["P4", "TT", "P5"] },
    { name: "6ths", items: ["m6", "M6"] },
    { name: "7ths", items: ["m7", "M7"] },
    { name: "Octave", items: ["P8"] },
  ], []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Keyboard shortcuts: answer selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "RUNNING" || isPlaying || !pending) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const idx = KEY_BINDINGS.indexOf(key);
      if (idx >= 0 && LABEL_ORDER[idx]) {
        e.preventDefault();
        const selected = LABEL_ORDER[idx];
        onAnswer(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, isPlaying, pending, completed, plannedQuestions]);

  const resetSession = () => {
    setCompleted(0);
    setCorrectCount(0);
    setFeedback(null);
    startedAtRef.current = null;
    setPending(null);
    setPhase("IDLE");
    setTotalLatencyMs(0);
    setSessionStats({} as Partial<Record<IntervalLabel, { seen: number; correct: number }>>);
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
    const p = buildIntervalPrompt({
      keyMode,
      fixedKey,
      directions: directions as any,
    });
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
        setTotalLatencyMs((t) => t + latencyMs);
        const correctLabel = (INTERVAL_CHOICES.find((c) => c.value === pending.interval)?.label || pending.interval) as IntervalLabel;
        setSessionStats((prev) => {
          const entry = prev[correctLabel] || { seen: 0, correct: 0 };
          return { ...prev, [correctLabel]: { seen: entry.seen + 1, correct: entry.correct + 1 } };
        });
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
    setTotalLatencyMs((t) => t + latencyMs);
    const revealedLabel = (INTERVAL_CHOICES.find((c) => c.value === pending.interval)?.label || pending.interval) as IntervalLabel;
    setSessionStats((prev) => {
      const entry = prev[revealedLabel] || { seen: 0, correct: 0 };
      return { ...prev, [revealedLabel]: { seen: entry.seen + 1, correct: entry.correct } };
    });

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

  const playContextOnly = async () => {
    if (!pending || !audioReady || isPlaying) return;
    setIsPlaying(true);
    try {
      await playContext(pending.key);
      setIsPlaying(false);
    } catch (error) {
      console.error("Error playing context:", error);
      setIsPlaying(false);
    }
  };

  const playQuestionOnly = async () => {
    if (!pending || !audioReady || isPlaying) return;
    setIsPlaying(true);
    try {
      await playInterval({ key: pending.key, interval: pending.interval, direction: pending.direction });
      setIsPlaying(false);
    } catch (error) {
      console.error("Error playing question:", error);
      setIsPlaying(false);
    }
  };

  const skip = async () => {
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
    setFeedback("Skipped");
    setTotalLatencyMs((t) => t + latencyMs);
    const skippedLabel = (INTERVAL_CHOICES.find((c) => c.value === pending.interval)?.label || pending.interval) as IntervalLabel;
    setSessionStats((prev) => {
      const entry = prev[skippedLabel] || { seen: 0, correct: 0 };
      return { ...prev, [skippedLabel]: { seen: entry.seen + 1, correct: entry.correct } };
    });
    setTimeout(() => {
      setFeedback(null);
      const nextCount = completed + 1;
      if (nextCount < plannedQuestions) {
        nextPrompt();
      } else {
        setPhase("REVIEW");
        setPending(null);
      }
    }, 800);
  };

  const accuracy = completed > 0 ? Math.round((correctCount / completed) * 100) : 0;
  const currentQuestionNumber = phase === "RUNNING" ? Math.min(plannedQuestions, Math.max(1, completed + 1)) : 0;
  const averageSeconds = completed > 0 ? Math.round(((totalLatencyMs / completed) / 100) ) / 10 : 0; // one decimal
  const sessionAccuracyList = useMemo(() => {
    const entries = Object.entries(sessionStats) as [IntervalLabel, { seen: number; correct: number }][];
    return entries
      .filter(([, v]) => v.seen > 0)
      .sort((a, b) => b[1].seen - a[1].seen)
      .slice(0, 6);
  }, [sessionStats]);

  return (
    <PracticeInterface
      title="Intervals"
      description="Train melodic intervals in key context."
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
          <div className="flex items-center justify-between">
            <div className="text-sm text-[color:var(--brand-muted)]">Ready? Adjust settings, then start.</div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">Settings</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Practice settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Session length */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Session length</div>
                    <Select
                      value={String(plannedQuestions)}
                      onValueChange={(v) => setPlannedQuestions(Number(v))}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Directions */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Directions</div>
                    <ToggleGroup
                      type="multiple"
                      value={directions}
                      onValueChange={(vals) => setDirections(vals)}
                      variant="outline"
                      size="sm"
                    >
                      {Array.from(DIRECTIONS).map((d) => (
                        <ToggleGroupItem key={d} value={d} aria-label={d}>
                          {d === "asc" ? "Ascending" : d === "desc" ? "Descending" : "Harmonic"}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>

                  {/* Key mode */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key</div>
                    <ToggleGroup
                      type="single"
                      value={keyMode}
                      onValueChange={(v) => setKeyMode((v as any) || "random")}
                      variant="outline"
                      size="sm"
                    >
                      <ToggleGroupItem value="random">Random</ToggleGroupItem>
                      <ToggleGroupItem value="fixed">Fixed</ToggleGroupItem>
                    </ToggleGroup>
                    {keyMode === "fixed" && (
                      <Select value={fixedKey} onValueChange={setFixedKey}>
                        <SelectTrigger className="w-[160px] mt-2">
                          <SelectValue placeholder="Key" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(KEYS).map((k) => (
                            <SelectItem key={k} value={k}>{k}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Running: progress and prompt controls */}
      {phase === "RUNNING" && (
        <div className="space-y-2 mb-2">
          <div className="text-sm font-medium text-[color:var(--brand-muted)]">
            Question {currentQuestionNumber} of {plannedQuestions}
          </div>
          <Progress value={plannedQuestions ? Math.min(100, Math.round((completed / plannedQuestions) * 100)) : 0} />
        </div>
      )}

      {/* Mode pill */}
      {phase === "RUNNING" && pending && (
        <div className="flex justify-center mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[color:var(--brand-line)] text-xs text-[color:var(--brand-muted)]">
            <span>{pending.direction === "asc" ? "Ascending" : pending.direction === "desc" ? "Descending" : "Harmonic"}</span>
            <span>•</span>
            <span>Key: {pending.key} major</span>
          </div>
        </div>
      )}

      {/* Play panel */}
      {phase === "RUNNING" && (
        <div className="flex items-center justify-center gap-3 mb-2">
          <Button variant="secondary" disabled={!pending || isPlaying} onClick={playContextOnly}>Play Context</Button>
          <Button variant="secondary" disabled={!pending || isPlaying} onClick={playQuestionOnly}>Play Question</Button>
          <Button variant="secondary" disabled={!pending || isPlaying} onClick={replayAudio}>Replay</Button>
        </div>
      )}

      {/* Helper actions */}
      {phase === "RUNNING" && (
        <div className="flex items-center justify-end mb-2 gap-2">
          <Button variant="ghost" disabled={!pending || isPlaying} onClick={skip}>Skip</Button>
          <Button variant="secondary" disabled={!pending || isPlaying} onClick={giveUp}>Reveal answer</Button>
        </div>
      )}

      {/* End-of-session summary */
      }
      {phase === "REVIEW" && (
        <div className="rounded-lg border border-[color:var(--brand-line)] p-4 bg-[color:var(--brand-panel)] mb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-medium">Session complete</div>
            <div className="text-sm">Score: {correctCount} / {plannedQuestions} ({accuracy}%)</div>
            <div className="text-sm">Average time: {averageSeconds.toFixed(1)} s</div>
          </div>
          {sessionAccuracyList.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sessionAccuracyList.map(([lab, v]) => {
                const pct = v.seen > 0 ? Math.round((v.correct / v.seen) * 100) : 0;
                return (
                  <div key={lab} className="flex items-center justify-between px-3 py-2 rounded border border-[color:var(--brand-line)] text-sm">
                    <span>{displayLabel(lab)}</span>
                    <span className="text-[color:var(--brand-muted)]">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => { setPhase("IDLE"); setSettingsOpen(true); }}>Adjust settings</Button>
            <Button variant="brand" onClick={startPractice}>Restart</Button>
          </div>
        </div>
      )}

      {phase === "RUNNING" && (
        <div className="space-y-4">
          {GROUPS.map((group) => (
            <div key={group.name} className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-[color:var(--brand-muted)]">{group.name}</div>
              <div className="grid grid-cols-4 gap-3">
                {group.items.map((label) => {
                  const keyHint = KEY_BINDINGS[LABEL_ORDER.indexOf(label)];
                  return (
                    <Button
                      key={label}
                      variant="brand"
                      disabled={!pending || isPlaying}
                      className="aspect-square text-base font-semibold hover:scale-105 transition-transform relative"
                      onClick={() => onAnswer(label)}
                      aria-keyshortcuts={keyHint}
                      title={keyHint ? `Shortcut: ${keyHint.toUpperCase()}` : undefined}
                    >
                      {displayLabel(label)}
                      {keyHint && (
                        <span className="absolute bottom-1 right-1 text-[10px] px-1 py-0.5 rounded border border-[color:var(--brand-line)] text-[color:var(--brand-muted)]">
                          {keyHint.toUpperCase()}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PracticeInterface>
  );
}


