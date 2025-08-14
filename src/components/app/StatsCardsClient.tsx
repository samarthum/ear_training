"use client";
import * as React from "react";
import { StatsCard } from "@/components/app/StatsCard";
import { TimeframeToggle } from "@/components/app/TimeframeToggle";
import { Target, TrendingUp, Flame } from "lucide-react";

type Range = "7d" | "30d" | "all";

type Totals = {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  streakDays: number;
};

export function StatsCardsClient() {
  const [range, setRange] = React.useState<Range>("7d");
  const [totals, setTotals] = React.useState<Totals | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const load = React.useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats?range=${r}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setTotals(json?.totals ?? null);
      } else {
        setTotals(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const p = url.searchParams.get("range") as Range | null;
      const stored = (localStorage.getItem("statsRange") as Range | null) ?? null;
      const initial = (p === "7d" || p === "30d" || p === "all")
        ? p
        : (stored === "7d" || stored === "30d" || stored === "all")
          ? stored
          : "7d";
      if (initial !== range) setRange(initial);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    void load(range);
    try {
      localStorage.setItem("statsRange", range);
      const url = new URL(window.location.href);
      url.searchParams.set("range", range);
      window.history.replaceState({}, "", url);
    } catch {
      // ignore
    }
  }, [range, load]);

  const attemptsValue = loading || !totals ? "—" : totals.totalAttempts;
  const accuracyValue = loading || !totals ? "—" : `${totals.accuracy}%`;
  const streakValue = loading || !totals ? "—" : `${totals.streakDays} day${totals.streakDays === 1 ? "" : "s"}`;
  const accuracySubtitle = loading || !totals ? undefined : `${totals.correctAttempts} correct`;
  const attemptsSubtitle = range === "all" ? "All-time across drills" : "Across drills";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <TimeframeToggle value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Attempts"
          value={attemptsValue}
          subtitle={attemptsSubtitle}
          icon={<Target size={18} />}
        />
        <StatsCard
          title="Accuracy"
          value={accuracyValue}
          subtitle={accuracySubtitle}
          icon={<TrendingUp size={18} />}
        />
        <StatsCard
          title="Current Streak"
          value={streakValue}
          subtitle={"Based on daily activity"}
          icon={<Flame size={18} />}
        />
      </div>
    </div>
  );
}


