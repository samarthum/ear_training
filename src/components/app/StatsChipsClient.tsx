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
    void load(range);
  }, [range, load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <TimeframeToggle value={range} onChange={setRange} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {loading || !totals ? (
          <>
            <KpiChip icon={<Target size={16} />} label="Attempts" value={"—"} />
            <KpiChip icon={<TrendingUp size={16} />} label="Accuracy" value={"—"} />
            <KpiChip icon={<Flame size={16} />} label="Streak" value={"—"} />
          </>
        ) : (
          <>
            <KpiChip icon={<Target size={16} />} label="Attempts" value={totals.totalAttempts} />
            <KpiChip icon={<TrendingUp size={16} />} label="Accuracy" value={`${totals.accuracy}%`} />
            <KpiChip icon={<Flame size={16} />} label="Streak" value={`${totals.streakDays}d`} />
          </>
        )}
      </div>
    </div>
  );
}


