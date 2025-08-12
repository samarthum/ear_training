"use client";
import { AppLayout } from "@/components/app/AppLayout";
import { PracticeInterface } from "@/components/app/PracticeInterface";

export default function ProgressionsPracticePage() {
  return (
    <AppLayout>
      <PracticeInterface
        title="Progression Training"
        description="Practice identifying common chord progressions in major keys. This feature is coming soon!"
      >
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎼</div>
          <p className="text-[color:var(--brand-muted)] text-lg">
            Chord progression training will be available soon. This will include I-IV-V-I, I-V-vi-IV, ii-V-I, and other common progressions.
          </p>
        </div>
      </PracticeInterface>
    </AppLayout>
  );
}