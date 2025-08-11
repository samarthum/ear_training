"use client";
import * as Tone from "tone";
import { Note } from "tonal";

// Lazy-initialized instruments
let piano: Tone.Sampler | null = null;
let pianoLoaded = false;
let pianoLoading: Promise<void> | null = null;
let fallbackPoly: Tone.PolySynth<Tone.Synth> | null = null;

function getFallbackPoly(): Tone.PolySynth<Tone.Synth> {
  if (!fallbackPoly) {
    fallbackPoly = new Tone.PolySynth(Tone.Synth).toDestination();
    fallbackPoly.set({ volume: -4 });
  }
  return fallbackPoly;
}

async function initPiano(): Promise<void> {
  if (pianoLoading) return pianoLoading;
  pianoLoading = new Promise<void>((resolve) => {
    piano = new Tone.Sampler({
      urls: {
        A1: "A1.mp3",
        C2: "C2.mp3",
        F2: "F2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        F3: "F3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        F4: "F4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        pianoLoaded = true;
        if (piano) {
          piano.volume.value = -6;
        }
        resolve();
      },
    }).toDestination();
  });
  return pianoLoading;
}

function getInstrument(): Tone.PolySynth<Tone.Synth> | Tone.Sampler {
  if (pianoLoaded && piano) return piano;
  return getFallbackPoly();
}

export async function ensureAudioReady(): Promise<void> {
  if (Tone.getContext().state !== "running") {
    await Tone.start();
  }
  // Begin loading the piano sampler in the background for low first-sound latency
  void initPiano();
}

export async function cleanupAudio(): Promise<void> {
  try {
    Tone.getTransport().cancel();
  } catch (error) {
    console.warn("Error cleaning up audio:", error);
  }
}

export async function playContext(key: string): Promise<void> {
  const inst = getInstrument();
  const startTime = Tone.now() + 0.1; // small offset to avoid timing conflicts
  inst.triggerAttackRelease(`${key}3`, "4n", startTime);
}

export async function playInterval(args: {
  key: string;
  interval: string; // like "3m" or "5P"
  direction: "asc" | "desc" | "harm";
}): Promise<void> {
  const inst = getInstrument();
  const startTime = Tone.now() + 0.1; // small offset to avoid timing conflicts
  const root = `${args.key}4`;

  if (args.direction === "harm") {
    // Play both notes as a single polyphonic event to avoid same-time scheduling errors
    const second = Note.transpose(root, args.interval);
    inst.triggerAttackRelease([root, second], "2n", startTime);
  } else {
    // Melodic interval: two notes in sequence
    const firstNote = root;
    const secondNote =
      args.direction === "asc"
        ? Note.transpose(root, args.interval)
        : Note.transpose(root, `-${args.interval}`);

    inst.triggerAttackRelease(firstNote, "4n", startTime);
    inst.triggerAttackRelease(secondNote, "4n", startTime + 0.6);
  }
}
