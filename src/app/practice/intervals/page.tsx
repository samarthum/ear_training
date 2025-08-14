import { AppLayout } from "@/components/app/AppLayout";
import { PracticeCard } from "@/components/app/PracticeCard";

export default function IntervalsSelectorPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--brand-text)]">
            Intervals
          </h1>
          <p className="text-sm sm:text-base text-[color:var(--brand-muted)]">
            Choose a practice type. Identification is available now; others are coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PracticeCard
            title="Interval Identification"
            description="Hear an interval and identify it."
            href="/practice/intervals/identify"
            icon={<span role="img" aria-label="target">🎯</span>}
            ctaLabel="Start"
          />
          <PracticeCard
            title="Interval Comparison"
            description="Compare two intervals — coming soon."
            href="#"
            icon={<span role="img" aria-label="trending up">📈</span>}
            disabled
            kicker="Soon"
          />
          <PracticeCard
            title="Interval Singing"
            description="Sing intervals to match — coming soon."
            href="#"
            icon={<span role="img" aria-label="microphone">🎤</span>}
            disabled
            kicker="Soon"
          />
        </div>
      </div>
    </AppLayout>
  );
}


