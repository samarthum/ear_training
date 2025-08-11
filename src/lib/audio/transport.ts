"use client";
import * as Tone from "tone";
import { Note, Interval } from "tonal";

export async function ensureAudioReady(): Promise<void> {
  if (Tone.getContext().state !== "running") {
    await Tone.start();
  }
}

export async function cleanupAudio(): Promise<void> {
  try {
    Tone.getTransport().cancel();
  } catch (error) {
    console.warn("Error cleaning up audio:", error);
  }
}

export async function playContext(key: string): Promise<void> {
  const synth = new Tone.Synth().toDestination();
  const startTime = Tone.now() + 0.1; // Small offset to avoid timing conflicts
  
  // Play just a brief tonic reference - single note to establish key center
  synth.triggerAttackRelease(`${key}3`, "4n", startTime);
  
  // Clean up synth after brief playback
  setTimeout(() => {
    synth.dispose();
  }, 800);
}

export async function playInterval(args: {
  key: string;
  interval: string; // like "3m" or "5P"  
  direction: "asc" | "desc" | "harm";
}): Promise<void> {
  const synth = new Tone.Synth().toDestination();
  const startTime = Tone.now() + 0.1; // Small offset to avoid timing conflicts
  const root = `${args.key}4`;
  
  if (args.direction === "harm") {
    // Harmonic interval: both notes simultaneously
    synth.triggerAttackRelease(root, "2n", startTime);
    synth.triggerAttackRelease(Note.transpose(root, args.interval), "2n", startTime);
  } else {
    // Melodic interval: two notes in sequence
    const firstNote = root;
    const secondNote = args.direction === "asc" 
      ? Note.transpose(root, args.interval)     // Ascending: root -> up interval
      : Note.transpose(root, `-${args.interval}`); // Descending: root -> down interval
    
    synth.triggerAttackRelease(firstNote, "4n", startTime);
    synth.triggerAttackRelease(secondNote, "4n", startTime + 0.6);
  }
  
  // Clean up synth after playback  
  setTimeout(() => {
    synth.dispose();
  }, 1800);
}

function normalizeInterval(iv: string): string {
  // Accept forms like "m3" or tonal style like "3m"; coerce to tonal's expected format
  if (/^[mMPAd][0-9]+$/.test(iv)) {
    // already like m3/M3/P5 etc - convert to tonal style
    const q = iv[0];
    const n = iv.slice(1);
    return `${n}${q}`; // to tonal style e.g. 3m
  }
  return iv; // assume tonal style e.g. 3m, 5P
}

function invertInterval(iv: string): string {
  try {
    const normalized = normalizeInterval(iv);
    // tonal Interval.invert works with tonal format like "3m"
    const inverted = Interval.invert(normalized);
    return inverted || normalized;
  } catch (error) {
    console.warn("Error inverting interval:", error);
    return iv;
  }
}


