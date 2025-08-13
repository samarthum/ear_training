export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { AttemptPostSchema } from "@/lib/validators/schemas";

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function computeNextStreak(previousLastAttemptAt: Date | null | undefined, previousStreakDays: number): number {
  const now = new Date();
  if (!previousLastAttemptAt) return 1;

  const last = toYMD(previousLastAttemptAt);
  const today = toYMD(now);
  if (last === today) {
    return previousStreakDays; // same day: keep streak
  }

  // yesterday check
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (last === toYMD(yesterday)) {
    return Math.max(1, previousStreakDays + 1);
  }

  // otherwise reset
  return 1;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = AttemptPostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { drillId, prompt, answer, isCorrect, latencyMs } = parsed.data;
  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.userStat.findUnique({ where: { userId } });

      // Prepare heat updates (intervals only for now)
      let nextIntervalHeat: Record<string, { seen: number; miss: number }> | undefined = undefined;
      if (prompt.kind === "INTERVAL") {
        const key = `${prompt.interval}-${prompt.direction}`; // e.g., "3m-asc"
        const currentHeat = (existing?.intervalHeat as any) || {};
        const currentEntry = currentHeat[key] || { seen: 0, miss: 0 };
        nextIntervalHeat = {
          ...currentHeat,
          [key]: {
            seen: (currentEntry.seen ?? 0) + 1,
            miss: (currentEntry.miss ?? 0) + (isCorrect ? 0 : 1),
          },
        };
      }

      const now = new Date();
      const nextStreak = computeNextStreak(existing?.lastAttemptAt ?? null, existing?.streakDays ?? 0);

      const attempt = await tx.attempt.create({
        data: {
          userId,
          drillId,
          prompt,
          answer,
          isCorrect,
          latencyMs,
        },
        select: { id: true },
      });

      const updated = await tx.userStat.upsert({
        where: { userId },
        update: {
          totalAttempts: { increment: 1 },
          correctAttempts: { increment: isCorrect ? 1 : 0 },
          lastAttemptAt: now,
          streakDays: nextStreak,
          ...(nextIntervalHeat ? { intervalHeat: nextIntervalHeat } : {}),
        },
        create: {
          userId,
          totalAttempts: 1,
          correctAttempts: isCorrect ? 1 : 0,
          lastAttemptAt: now,
          streakDays: 1,
          ...(nextIntervalHeat ? { intervalHeat: nextIntervalHeat } : {}),
        },
        select: { totalAttempts: true, correctAttempts: true, streakDays: true },
      });

      return { attemptId: attempt.id, updated };
    });

    return NextResponse.json({
      id: result.attemptId,
      isCorrect,
      totals: {
        totalAttempts: result.updated.totalAttempts,
        correctAttempts: result.updated.correctAttempts,
        streakDays: result.updated.streakDays,
      },
    });
  } catch (error) {
    console.error("Attempts POST failed", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


