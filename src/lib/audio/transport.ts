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
  } catch {}
}

export async function playContext(key: string): Promise<void> {
  const synth = new Tone.Synth().toDestination();
  const now = Tone.now();
  synth.triggerAttackRelease(`${key}3`, "2n", now);
  synth.triggerAttackRelease(`${key}3`, "8n", now + 0.6);
  synth.triggerAttackRelease(Note.transpose(`${key}3`, "3M"), "8n", now + 0.9);
  synth.triggerAttackRelease(Note.transpose(`${key}3`, "5P"), "8n", now + 1.2);
}

export async function playInterval(args: {
  key: string;
  interval: string; // like "3m" or "5P"
  direction: "asc" | "desc" | "harm";
}): Promise<void> {
  const synth = new Tone.Synth().toDestination();
  const now = Tone.now();
  const root = `${args.key}4`;
  if (args.direction === "harm") {
    synth.triggerAttackRelease(root, "2n", now);
    synth.triggerAttackRelease(Note.transpose(root, normalizeInterval(args.interval)), "2n", now);
    return;
  }
  synth.triggerAttackRelease(root, "8n", now);
  const second =
    args.direction === "asc"
      ? Note.transpose(root, normalizeInterval(args.interval))
      : Note.transpose(root, invertInterval(args.interval));
  synth.triggerAttackRelease(second, "8n", now + 0.6);
}

function normalizeInterval(iv: string): string {
  // Accept forms like "m3" or tonal style like "3m"; coerce to tonal’s expected format
  if (/^[mMPAd][0-9]$/.test(iv)) {
    // already like m3/M3/P5 etc
    const q = iv[0];
    const n = iv.slice(1);
    return `${n}${q}`; // to tonal style e.g. 3m
  }
  return iv; // assume tonal style e.g. 3m, 5P
}

function invertInterval(iv: string): string {
  try {
    const n = normalizeInterval(iv);
    // tonal Interval.invert works with tonal format like "3m"
    return Interval.invert(n) ?? n;
  } catch {
    return iv;
  }
}


