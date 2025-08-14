import { AppLayout } from "@/components/app/AppLayout";
import { PracticeCard } from "@/components/app/PracticeCard";

export default function PracticeLandingPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--brand-text)]">
            Practice
          </h1>
          <p className="text-sm sm:text-base text-[color:var(--brand-muted)]">
            Choose a category to begin. Intervals is available now; Chords and Rhythm are coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PracticeCard
            title="Intervals"
            description="Identify, compare, and sing intervals. Start with Identification."
            href="/practice/intervals"
            icon={<span role="img" aria-label="Intervals">🎵</span>}
          />
          <PracticeCard
            title="Chords"
            description="Qualities, inversions, and progressions. Coming soon."
            href="#"
            icon={<span role="img" aria-label="Chords">🎹</span>}
            disabled
            kicker="Soon"
          />
          <PracticeCard
            title="Rhythm"
            description="Subdivision and pattern recognition. Coming soon."
            href="#"
            icon={<span role="img" aria-label="Rhythm">🥁</span>}
            disabled
            kicker="Soon"
          />
        </div>
      </div>
    </AppLayout>
  );
}


