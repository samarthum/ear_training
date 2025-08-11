"use client";
import { useEffect, useState } from "react";
import { ensureAudioReady, playContext, playInterval, cleanupAudio } from "@/lib/audio/transport";
import { buildIntervalPrompt, INTERVAL_CHOICES, isCorrectInterval, type IntervalLabel } from "@/lib/theory/intervals";
import type { IntervalPrompt } from "@/types/drills";

export default function IntervalsPracticePage() {
  const [audioReady, setAudioReady] = useState(false);
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
        await ensureAudioReady();
        setAudioReady(true);
      } catch (error) {
        console.error("Failed to start audio:", error);
        return;
      }
    }
    nextPrompt();
  };

  const nextPrompt = async () => {
    const p = buildIntervalPrompt(); // Now randomizes key too
    setPending(p);
    setIsPlaying(true);
    
    try {
      // Play context then interval with improved timing
      await playContext(p.key);
      // Wait for context to finish before playing interval (context is now ~500ms)
      setTimeout(async () => {
        await playInterval({ key: p.key, interval: p.interval, direction: p.direction });
        setIsPlaying(false);
      }, 900); // Increased buffer for better separation
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
        nextPrompt(); // Auto-advance on correct answer
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
      }, 900); // Improved timing to match nextPrompt
    } catch (error) {
      console.error("Error replaying audio:", error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Interval Training</h1>
      <div className="flex gap-2 mb-4">
        <button
          onClick={pending ? replayAudio : startPractice}
          disabled={isPlaying}
          className="rounded-md bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {isPlaying ? "Playing..." : pending ? "🔄 Replay" : "🎵 Start"}
        </button>
        {feedback && (
          <div className="flex items-center">
            <span className="text-sm font-medium">{feedback}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {INTERVAL_CHOICES.map((opt) => (
          <button
            key={opt.value}
            disabled={!pending || isPlaying}
            className="border rounded-md p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => onAnswer(opt.label)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      {pending && (
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Current:</strong> {pending.direction === "asc" ? "Ascending" : pending.direction === "desc" ? "Descending" : "Harmonic"} interval in {pending.key} major</p>
        </div>
      )}
    </div>
  );
}


