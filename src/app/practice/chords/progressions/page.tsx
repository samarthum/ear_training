import { AppLayout } from "@/components/app/AppLayout";
import { PracticeInterface } from "@/components/app/PracticeInterface";

export default function ChordProgressionsPage() {
  return (
    <AppLayout>
      <PracticeInterface title="Chord Progressions" description="Coming soon">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎼</div>
          <p className="text-[color:var(--brand-muted)] text-lg">This drill is under development.</p>
        </div>
      </PracticeInterface>
    </AppLayout>
  );
}


