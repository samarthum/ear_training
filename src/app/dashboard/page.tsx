import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/app/AppLayout";
import { PracticeCard } from "@/components/app/PracticeCard";
import { StatsCard } from "@/components/app/StatsCard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-[color:var(--brand-text)] tracking-tight">
            Welcome back{session.user.name ? `, ${session.user.name}` : ''}
          </h1>
          <p className="text-lg text-[color:var(--brand-muted)] max-w-2xl mx-auto">
            Continue your ear training journey with interval recognition, chord identification, and progression analysis.
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Sessions"
            value="0"
            subtitle="Start practicing to see stats"
            icon="🎯"
          />
          <StatsCard 
            title="Accuracy"
            value="--"
            subtitle="Complete sessions to track progress"
            icon="📈"
          />
          <StatsCard 
            title="Current Streak" 
            value="0 days"
            subtitle="Begin your practice streak"
            icon="🔥"
          />
        </div>

        {/* Practice options */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-[color:var(--brand-text)] text-center">
            Choose Your Practice
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PracticeCard 
              title="Intervals"
              description="Practice identifying intervals in tonal context. Start with major and minor seconds, thirds, fourths, and fifths."
              href="/practice/intervals"
              icon="🎵"
            />
            <PracticeCard
              title="Chords" 
              description="Recognize chord qualities and inversions. Master major, minor, diminished, and augmented triads."
              href="/practice/chords"
              icon="🎹"
            />
            <PracticeCard
              title="Progressions"
              description="Identify common chord progressions like I-IV-V-I, I-V-vi-IV, and jazz progressions."  
              href="/practice/progressions"
              icon="🎼"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


