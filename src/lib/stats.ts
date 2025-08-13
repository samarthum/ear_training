import { prisma } from "@/lib/db/prisma";

type HeatEntry = { seen: number; miss: number };
type HeatMap = Record<string, HeatEntry>;

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function asHeatMap(json: unknown): HeatMap {
  if (!json || typeof json !== "object") return {};
  const obj = json as Record<string, unknown>;
  const out: HeatMap = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object") {
      const v = value as Record<string, unknown>;
      const seen = typeof v.seen === "number" ? v.seen : 0;
      const miss = typeof v.miss === "number" ? v.miss : 0;
      out[key] = { seen, miss };
    }
  }
  return out;
}

export interface UserStats {
  totals: {
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    streakDays: number;
  };
  intervalHeat: HeatMap;
  chordHeat: HeatMap;
  topMissedIntervals: Array<{ key: string; seen: number; miss: number; rate: number }>;
  last7: Array<{ date: string; total: number; correct: number }>;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  // Totals and heat from UserStat
  const stat = await prisma.userStat.findUnique({ where: { userId } });
  const totalAttempts = stat?.totalAttempts ?? 0;
  const correctAttempts = stat?.correctAttempts ?? 0;
  const streakDays = stat?.streakDays ?? 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  const intervalHeat = asHeatMap(stat?.intervalHeat);
  const chordHeat = asHeatMap(stat?.chordHeat);

  // Top missed intervals by miss rate (then by miss count)
  const topMissedIntervals = Object.entries(intervalHeat)
    .map(([key, val]) => ({ key, seen: val.seen, miss: val.miss, rate: val.seen > 0 ? val.miss / val.seen : 0 }))
    .filter((x) => x.seen >= 3) // require some support to avoid noise
    .sort((a, b) => (b.rate - a.rate) || (b.miss - a.miss))
    .slice(0, 3);

  // Last 7 days buckets
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6); // inclusive 7-day window

  const attempts = await prisma.attempt.findMany({
    where: { userId, createdAt: { gte: start } },
    select: { createdAt: true, isCorrect: true },
  });

  const buckets: Record<string, { total: number; correct: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets[toYMD(d)] = { total: 0, correct: 0 };
  }

  for (const a of attempts) {
    const key = toYMD(a.createdAt);
    const b = buckets[key] ?? (buckets[key] = { total: 0, correct: 0 });
    b.total += 1;
    if (a.isCorrect) b.correct += 1;
  }

  const last7 = Object.entries(buckets)
    .sort(([d1], [d2]) => (d1 < d2 ? -1 : 1))
    .map(([date, { total, correct }]) => ({ date, total, correct }));

  return {
    totals: { totalAttempts, correctAttempts, accuracy, streakDays },
    intervalHeat,
    chordHeat,
    topMissedIntervals,
    last7,
  };
}


