import { AppLayout } from "@/components/app/AppLayout";
import { PracticeInterface } from "@/components/app/PracticeInterface";

export default function ChordsPracticePage() {
  return (
    <AppLayout>
      <PracticeInterface
        title="Chord Training"
        description="Practice identifying chord qualities in tonal context. This feature is coming soon!"
      >
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎹</div>
          <p className="text-[color:var(--brand-muted)] text-lg">
            Chord recognition training will be available soon. This will include major, minor, diminished, and augmented triads with inversions.
          </p>
        </div>
      </PracticeInterface>
    </AppLayout>
  );
}