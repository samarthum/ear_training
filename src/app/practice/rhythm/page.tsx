import { AppLayout } from "@/components/app/AppLayout";
import { PracticeInterface } from "@/components/app/PracticeInterface";

export default function RhythmPage() {
  return (
    <AppLayout>
      <PracticeInterface title="Rhythm" description="Coming soon">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🥁</div>
          <p className="text-[color:var(--brand-muted)] text-lg">Rhythm drills will be available in a future update.</p>
        </div>
      </PracticeInterface>
    </AppLayout>
  );
}


