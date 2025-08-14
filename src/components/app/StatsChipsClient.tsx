"use client";
import * as React from "react";
import { KpiChip } from "@/components/app/KpiChip";
import { TimeframeToggle } from "@/components/app/TimeframeToggle";
import { Target, TrendingUp, Flame } from "lucide-react";

type Range = "7d" | "30d" | "all";

type Totals = {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  streakDays: number;
};

export function StatsChipsClient() {
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
    // Initialize from URL param or localStorage
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <TimeframeToggle value={range} onChange={setRange} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {loading || !totals ? (
          <>
            <KpiChip icon={<Target size={16} />} label="Attempts" value={"—"} ariaLabel={`Attempts over ${range}`} />
            <KpiChip icon={<TrendingUp size={16} />} label="Accuracy" value={"—"} ariaLabel={`Accuracy over ${range}`} />
            <KpiChip icon={<Flame size={16} />} label="Streak" value={"—"} ariaLabel={`Current streak`} />
          </>
        ) : (
          <>
            <KpiChip icon={<Target size={16} />} label="Attempts" value={totals.totalAttempts} ariaLabel={`Attempts over ${range}: ${totals.totalAttempts}`} />
            <KpiChip icon={<TrendingUp size={16} />} label="Accuracy" value={`${totals.accuracy}%`} ariaLabel={`Accuracy over ${range}: ${totals.accuracy} percent`} />
            <KpiChip icon={<Flame size={16} />} label="Streak" value={`${totals.streakDays}d`} ariaLabel={`Current streak: ${totals.streakDays} days`} />
          </>
        )}
      </div>
    </div>
  );
}


