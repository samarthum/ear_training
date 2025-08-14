import { AppLayout } from "@/components/app/AppLayout";
import { PracticeCard } from "@/components/app/PracticeCard";

export default function ChordsSelectorPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[color:var(--brand-text)]">
            Chords
          </h1>
          <p className="text-sm sm:text-base text-[color:var(--brand-muted)]">
            Choose a practice type. All chord drills are coming soon.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PracticeCard
            title="Chord Identification"
            description="Identify chord qualities in context — coming soon."
            href="#"
            icon={<span role="img" aria-label="Chord Identification">🎹</span>}
            disabled
            kicker="Soon"
          />
          <PracticeCard
            title="Chord Inversions"
            description="Recognize chord inversions — coming soon."
            href="#"
            icon={<span role="img" aria-label="Chord Inversions">🔁</span>}
            disabled
            kicker="Soon"
          />
          <PracticeCard
            title="Chord Progressions"
            description="Identify common progressions — coming soon."
            href="#"
            icon={<span role="img" aria-label="Chord Progressions">🎼</span>}
            disabled
            kicker="Soon"
          />
        </div>
      </div>
    </AppLayout>
  );
}