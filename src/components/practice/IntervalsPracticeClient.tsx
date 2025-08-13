"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { ensureAudioReady, playContext, playInterval, cleanupAudio } from "@/lib/audio/transport";
import { buildIntervalPrompt, INTERVAL_CHOICES, isCorrectInterval, KEYS, DIRECTIONS, type IntervalLabel } from "@/lib/theory/intervals";
import type { IntervalPrompt } from "@/types/drills";
import type { IntervalDirection } from "@/types/drills";
import { PracticeInterface } from "@/components/app/PracticeInterface";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export default function IntervalsPracticeClient({ drillId }: { drillId: string }) {
  const [audioReady, setAudioReady] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [pending, setPending] = useState<IntervalPrompt | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<IntervalLabel | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<IntervalLabel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  // Sessionized UX state
  type Phase = "IDLE" | "RUNNING" | "REVIEW";
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [plannedQuestions, setPlannedQuestions] = useState<number>(10);
  const [completed, setCompleted] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [wrongAttempts, setWrongAttempts] = useState<number>(0);
  const sessionDone = plannedQuestions > 0 && completed >= plannedQuestions;
  const [totalLatencyMs, setTotalLatencyMs] = useState<number>(0);
  const [sessionStats, setSessionStats] = useState<Partial<Record<IntervalLabel, { seen: number; correct: number }>>>({});
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<IntervalLabel[]>([]);

  // Settings (Idle only editable)
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState<boolean>(false);
  const [showKeycaps, setShowKeycaps] = useState<boolean>(true);
  const [keyMode, setKeyMode] = useState<"random" | "fixed">("random");
  const [fixedKey, setFixedKey] = useState<string>("C");
  const [directions, setDirections] = useState<IntervalDirection[]>(["asc", "desc", "harm"]);
  const [volume, setVolume] = useState<number>(75);
  const [instrument, setInstrument] = useState<"piano" | "sine">("sine");

  // Keyboard shortcuts mapping (4 multiple choice options)
  const KEY_BINDINGS: string[] = ["1","2","3","4"];
  
  // All available intervals for generating multiple choice options
  const ALL_INTERVALS: IntervalLabel[] = ["m2","M2","m3","M3","P4","TT","P5","m6","M6","m7","M7","P8"];

  const displayLabel = (label: IntervalLabel): string => {
    if (label === "TT") return "Tritone (TT, d5/♯4)";
    if (label === "P8") return "Octave (P8)";
    if (label === "m2") return "Minor 2nd (m2, 1 semitone)";
    if (label === "M2") return "Major 2nd (M2, 2 semitones)";
    if (label === "m3") return "Minor 3rd (m3, 3 semitones)";
    if (label === "M3") return "Major 3rd (M3, 4 semitones)";
    if (label === "P4") return "Perfect 4th (P4, 5 semitones)";
    if (label === "P5") return "Perfect 5th (P5, 7 semitones)";
    if (label === "m6") return "Minor 6th (m6, 8 semitones)";
    if (label === "M6") return "Major 6th (M6, 9 semitones)";
    if (label === "m7") return "Minor 7th (m7, 10 semitones)";
    if (label === "M7") return "Major 7th (M7, 11 semitones)";
    return label;
  };

  const getShortLabel = (label: IntervalLabel): string => {
    if (label === "TT") return "Tritone";
    if (label === "P8") return "Octave";
    if (label === "m2") return "Minor 2nd";
    if (label === "M2") return "Major 2nd";
    if (label === "m3") return "Minor 3rd";
    if (label === "M3") return "Major 3rd";
    if (label === "P4") return "Perfect 4th";
    if (label === "P5") return "Perfect 5th";
    if (label === "m6") return "Minor 6th";
    if (label === "M6") return "Major 6th";
    if (label === "m7") return "Minor 7th";
    if (label === "M7") return "Major 7th";
    return label;
  };

  // Generate 4 multiple choice options: 1 correct + 3 distractors
  const generateMultipleChoiceOptions = (correctAnswer: IntervalLabel): IntervalLabel[] => {
    const distractors = ALL_INTERVALS.filter(interval => interval !== correctAnswer);
    
    // Shuffle distractors and take 3
    const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Combine correct answer with distractors
    const allOptions = [correctAnswer, ...shuffledDistractors];
    
    // Shuffle final options so correct answer isn't always in same position
    return allOptions.sort(() => Math.random() - 0.5);
  };

  // Keyboard shortcuts: answer selection (defined after onAnswer is declared, and without extra deps)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "RUNNING" || isPlaying || !pending || multipleChoiceOptions.length === 0) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const idx = KEY_BINDINGS.indexOf(key);
      if (idx >= 0 && multipleChoiceOptions[idx]) {
        e.preventDefault();
        const selected = multipleChoiceOptions[idx];
        onAnswer(selected);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // We intentionally omit onAnswer and arrays to avoid re-subscribing each render; guard with phase/isPlaying/pending
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isPlaying, pending, multipleChoiceOptions]);

  // Multiple choice options are now generated dynamically per question

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Keyboard shortcuts: answer selection (placed after nextPrompt defined to avoid ordering issues)

  const resetSession = () => {
    setCompleted(0);
    setCorrectCount(0);
    setCurrentStreak(0);
    setWrongAttempts(0);
    setFeedback(null);
    setSelectedAnswer(null);
    setRevealedAnswer(null);
    startedAtRef.current = null;
    setPending(null);
    setPhase("IDLE");
    setTotalLatencyMs(0);
    setSessionStats({} as Partial<Record<IntervalLabel, { seen: number; correct: number }>>);
    setMultipleChoiceOptions([]);
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
    // Reset feedback states
    setSelectedAnswer(null);
    setRevealedAnswer(null);
    setFeedback(null);
    
    const p = buildIntervalPrompt({
      keyMode,
      fixedKey,
      directions,
    });
    setPending(p);
    
    // Generate multiple choice options for this question
    const correctLabel = (INTERVAL_CHOICES.find((c) => c.value === p.interval)?.label || p.interval) as IntervalLabel;
    const mcOptions = generateMultipleChoiceOptions(correctLabel);
    setMultipleChoiceOptions(mcOptions);
    
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
    const intervalLabel = label as IntervalLabel;
    const correct = isCorrectInterval(pending, intervalLabel);
    
    setSelectedAnswer(intervalLabel);
    setFeedback(correct ? "✅ Correct! Well done!" : "❌ Not quite right");

    // POST attempt
    try {
      const latencyMs = startedAtRef.current ? Math.max(0, Math.round(performance.now() - startedAtRef.current)) : 0;
      if (correct) {
        setCorrectCount((c) => c + 1);
        setCurrentStreak((s) => s + 1);
        setCompleted((n) => n + 1);
        setTotalLatencyMs((t) => t + latencyMs);
        setWrongAttempts(0);
        const correctLabel = (INTERVAL_CHOICES.find((c) => c.value === pending.interval)?.label || pending.interval) as IntervalLabel;
        setSessionStats((prev) => {
          const entry = prev[correctLabel] || { seen: 0, correct: 0 };
          return { ...prev, [correctLabel]: { seen: entry.seen + 1, correct: entry.correct + 1 } };
        });
      } else {
        setWrongAttempts((w) => w + 1);
        setCurrentStreak(0);
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
      setSelectedAnswer(null);
      setRevealedAnswer(null);
      // Only advance if correct and session not yet complete
      const nextCount = correct ? completed + 1 : completed;
      if (correct && nextCount < plannedQuestions) {
        nextPrompt();
      } else if (correct && nextCount >= plannedQuestions) {
        setPhase("REVIEW");
        setPending(null);
      }
    }, 1500);
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

    const correctLabel = (INTERVAL_CHOICES.find((c) => c.value === pending.interval)?.label || pending.interval) as IntervalLabel;
    setRevealedAnswer(correctLabel);
    setFeedback(`💡 Answer: ${displayLabel(correctLabel)}`);
    setTimeout(() => {
      setFeedback(null);
      setRevealedAnswer(null);
      const nextCount = completed + 1;
      if (nextCount < plannedQuestions) {
        nextPrompt();
      } else {
        setPhase("REVIEW");
        setPending(null);
      }
    }, 2000);
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
      description="Train intervals in key context."
      onStart={startPractice}
      onReplay={replayAudio}
      isPlaying={isPlaying}
      isLoading={audioLoading}
      feedback={feedback}
      hasStarted={phase !== "IDLE"}
      currentInfo={undefined}
      belowPanel={phase === "RUNNING" && pending ? (
        <div className="flex justify-center mb-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[color:var(--brand-panel)] border border-[color:var(--brand-line)] text-sm font-medium text-[color:var(--brand-text)] shadow-sm">
            <span className={cn(
              "inline-flex items-center gap-2",
              pending.direction === "asc" && "text-emerald-600 dark:text-emerald-400",
              pending.direction === "desc" && "text-blue-600 dark:text-blue-400",
              pending.direction === "harm" && "text-purple-600 dark:text-purple-400"
            )}>
              {pending.direction === "asc" ? 
                <>Ascending</> :
                pending.direction === "desc" ? 
                <>Descending</> :
                <>Harmonic</>
              }
            </span>
            <span className="text-[color:var(--brand-muted)]">•</span>
            <span>Key: {pending.key} major</span>
          </div>
        </div>
      ) : null}
    >
      {/* Idle: settings only */}
      {phase === "IDLE" && (
        <div className="text-center space-y-6 max-w-md mx-auto">
            <div className="space-y-3">
              <div className="text-center text-xl font-bold text-[color:var(--brand-text)]">
                Ready to practice intervals?
              </div>
              <div className="text-sm text-[color:var(--brand-muted)] leading-relaxed">Challenge yourself to identify intervals in musical context. Each session adapts to your skill level.</div>
            </div>
            
            <div className="flex justify-center mb-3">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="default" className="px-6 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-gray-300 dark:border-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  </svg>
                  Customize practice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg sm:max-w-xl">
                <DialogHeader className="text-center pb-2 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                  <DialogTitle className="text-2xl font-bold text-[color:var(--brand-text)] flex items-center justify-center gap-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                    Practice Settings
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-2">
                  {/* Session length */}
                  <div className="space-y-3">
                    <label className="text-base font-semibold text-[color:var(--brand-text)] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                      Session Length
                    </label>
                    <div className="flex gap-2">
                      {[5, 10, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => setPlannedQuestions(num)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all",
                            "hover:scale-105 active:scale-95",
                            plannedQuestions === num
                              ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent)]/10 text-[color:var(--brand-accent)]"
                              : "border-gray-200 dark:border-gray-700 text-[color:var(--brand-muted)] hover:border-[color:var(--brand-accent)]/50"
                          )}
                        >
                          {num} questions
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Directions */}
                  <div className="space-y-3">
                    <label className="text-base font-semibold text-[color:var(--brand-text)] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6zm0-2l6-6-1.41-1.41L12 3.17 7.41-.42 6 1l6 6z"/>
                      </svg>
                      Direction Types
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:flex">
                      {Array.from(DIRECTIONS).map((d) => {
                        const isSelected = directions.includes(d);
                        const label = d === "asc" ? "Ascending" : d === "desc" ? "Descending" : "Harmonic";
                        // Simplify on mobile: no icons to avoid cramped layout
                        const icon = null;
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              if (isSelected) {
                                if (directions.length > 1) {
                                  setDirections(directions.filter(dir => dir !== d));
                                }
                              } else {
                                setDirections([...directions, d]);
                              }
                            }}
                            className={cn(
                              "py-3 px-3 rounded-lg border-2 font-medium text-sm transition-all text-sm sm:text-base",
                              "hover:scale-105 active:scale-95",
                              isSelected
                                ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent)]/10 text-[color:var(--brand-accent)]"
                                : "border-gray-200 dark:border-gray-700 text-[color:var(--brand-muted)] hover:border-[color:var(--brand-accent)]/50"
                            )}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Key mode */}
                  <div className="space-y-3">
                    <label className="text-base font-semibold text-[color:var(--brand-text)] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                      Key Selection
                    </label>
                    <div className="grid grid-cols-2 sm:flex gap-2 mb-3">
                      {["random", "fixed"].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setKeyMode(mode as "random" | "fixed")}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-lg border-2 font-semibold transition-all capitalize",
                            "hover:scale-105 active:scale-95",
                            keyMode === mode
                              ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent)]/10 text-[color:var(--brand-accent)]"
                              : "border-gray-200 dark:border-gray-700 text-[color:var(--brand-muted)] hover:border-[color:var(--brand-accent)]/50"
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                    {keyMode === "fixed" && (
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from(KEYS).map((k) => (
                          <button
                            key={k}
                            onClick={() => setFixedKey(k)}
                            className={cn(
                              "py-2 px-3 rounded-lg border-2 font-semibold transition-all",
                              "hover:scale-105 active:scale-95",
                              fixedKey === k
                                ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent)]/10 text-[color:var(--brand-accent)]"
                                : "border-gray-200 dark:border-gray-700 text-[color:var(--brand-muted)] hover:border-[color:var(--brand-accent)]/50"
                            )}
                          >
                            {k}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Audio preferences: temporarily removed for a simpler settings UI */}
                </div>
              </DialogContent>
            </Dialog>
            </div>
            
            {/* Mode pill - display only */}
            <div className="mt-4 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[color:var(--brand-panel)] border border-[color:var(--brand-line)] text-sm font-medium text-[color:var(--brand-text)] shadow-sm">
                <span className="text-[color:var(--brand-muted)]">
                  {keyMode === "random" ? "Random keys" : `Fixed: ${fixedKey} major`} • {directions.length === 3 ? "All directions" : directions.map(d => d === "asc" ? "Ascending" : d === "desc" ? "Descending" : "Harmonic").join(", ")}
                </span>
              </div>
            </div>
        </div>
      )}

      {/* Running: progress and prompt controls */}
      {phase === "RUNNING" && (
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[color:var(--brand-text)]">
              Q {currentQuestionNumber}/{plannedQuestions}
            </div>
            <div className="flex items-center gap-2">
              {currentStreak > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                  </svg>
                  {currentStreak}
                </div>
              )}
            </div>
          </div>
          <Progress value={plannedQuestions ? Math.min(100, Math.round((completed / plannedQuestions) * 100)) : 0} className="h-2" />
        </div>
      )}

      {/* Play panel - Simplified */}
      {phase === "RUNNING" && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <Button variant="brandPrimary" size="lg" disabled={!pending || isPlaying} onClick={playQuestionOnly} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play Question
          </Button>
          <Button variant="outline" size="sm" disabled={!pending || isPlaying} onClick={playContextOnly} className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
            Context
          </Button>
        </div>
      )}

      {/* Mode pill moved below panel */}

      {/* Helper actions */}
      {phase === "RUNNING" && (
        <div className="flex items-center justify-between mb-2">
          {/* Helper tooltip hidden on mobile to reduce clutter */}
          <div className="hidden sm:block">
            <Dialog open={keyboardHelpOpen} onOpenChange={setKeyboardHelpOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[color:var(--brand-muted)] flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
                  ?
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Keyboard Shortcuts</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="text-sm text-[color:var(--brand-muted)] mb-3">Use number keys 1-4 to select answers quickly:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {KEY_BINDINGS.map((key, idx) => (
                      <div key={key} className="flex items-center justify-between px-3 py-2 rounded bg-gray-50 dark:bg-gray-800">
                        <span>Option {idx + 1}</span>
                        <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded font-mono">{key.toUpperCase()}</kbd>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-[color:var(--brand-muted)] mt-3">Keys correspond to button positions: 1=top-left, 2=top-right, 3=bottom-left, 4=bottom-right</div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex w-full justify-between sm:w-auto sm:justify-normal sm:gap-2">
            <Button variant="ghost" size="sm" disabled={!pending || isPlaying} onClick={skip} className="text-[color:var(--brand-muted)]">
              Skip
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={!pending || isPlaying || wrongAttempts === 0} 
              onClick={giveUp} 
              className="text-[color:var(--brand-muted)]"
            >
              Reveal answer
            </Button>
          </div>
        </div>
      )}

      {/* End-of-session summary */}
      {phase === "REVIEW" && (
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[color:var(--brand-text)] mb-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 13.59l-2.83-2.83-1.41 1.41 4.24 4.24 7.07-7.07-1.41-1.41-5.66 5.66z"/>
              </svg>
              Session Complete!
            </div>
            <div className="text-lg text-[color:var(--brand-muted)]">
              Great work on your interval training
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{correctCount}/{plannedQuestions}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Correct</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/30 border border-emerald-200 dark:border-emerald-800">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{accuracy}%</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Accuracy</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{averageSeconds.toFixed(1)}s</div>
              <div className="text-sm text-amber-600 dark:text-amber-400">Avg Time</div>
            </div>
          </div>

          {sessionAccuracyList.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[color:var(--brand-text)] mb-3">Interval Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sessionAccuracyList.map(([lab, v]) => {
                  const pct = v.seen > 0 ? Math.round((v.correct / v.seen) * 100) : 0;
                  return (
                    <div key={lab} className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg border text-sm",
                      pct >= 80 ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10" :
                      pct >= 60 ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10" :
                      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10"
                    )}>
                      <span className="font-medium">{getShortLabel(lab)}</span>
                      <span className={cn(
                        "font-semibold",
                        pct >= 80 ? "text-green-700 dark:text-green-300" :
                        pct >= 60 ? "text-yellow-700 dark:text-yellow-300" :
                        "text-red-700 dark:text-red-300"
                      )}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="mt-auto flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => { setPhase("IDLE"); setSettingsOpen(true); }} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              Adjust settings
            </Button>
            <Button variant="brandPrimary" size="lg" onClick={startPractice} className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Practice again
            </Button>
          </div>
        </div>
      )}

      {phase === "RUNNING" && multipleChoiceOptions.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* 2x2 Multiple Choice Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            {multipleChoiceOptions.map((label, index) => {
              const keyHint = KEY_BINDINGS[index];
              const isSelected = selectedAnswer === label;
              const isRevealed = revealedAnswer === label;
              const isCorrect = pending && isCorrectInterval(pending, label);
              
              return (
                <Button
                  key={`${label}-${index}`}
                  variant="brand"
                  size="lg"
                  disabled={!pending || isPlaying || selectedAnswer !== null}
                  className={cn(
                    "min-h-[64px] text-sm font-semibold hover:scale-[1.02] active:scale-[0.98]",
                    "transition-all duration-300 relative px-3",
                    // Stronger default appearance for unselected options
                    !isSelected && !isRevealed && "border border-[color:var(--brand-line)] bg-white/80 dark:bg-gray-900/40 shadow-sm",
                    "focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-accent)] focus:ring-offset-2",
                    // Visual feedback states
                    isSelected && isCorrect && "border-green-500 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 animate-pulse",
                    isSelected && !isCorrect && "border-red-500 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
                    isRevealed && "border-blue-500 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 ring-2 ring-blue-300"
                  )}
                  onClick={() => onAnswer(label)}
                  aria-keyshortcuts={keyHint}
                  title={keyHint ? `Shortcut: ${keyHint.toUpperCase()}` : undefined}
                >
                  <span className="flex flex-col items-center justify-center">
                    <span className="leading-tight text-center flex flex-col items-center gap-1">
                      <span>{getShortLabel(label)}</span>
                      <div className="flex items-center gap-1">
                        {isSelected && isCorrect && <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
                        {isSelected && !isCorrect && <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>}
                        {isRevealed && <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                      </div>
                    </span>
                    {keyHint && showKeycaps && (
                      <span className="hidden sm:inline text-xs mt-1 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                        {keyHint.toUpperCase()}
                      </span>
                    )}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </PracticeInterface>
  );
}


