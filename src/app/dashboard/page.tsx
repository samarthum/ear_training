import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { PracticeCard } from "@/components/app/PracticeCard";
import { StatsCard } from "@/components/app/StatsCard";
import { getUserStats } from "@/lib/stats";
import { Skeleton } from "@/components/ui/skeleton";

async function StatsSection({ userId }: { userId: string }) {
  const stats = await getUserStats(userId);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard 
        title="Total Attempts"
        value={stats.totals.totalAttempts}
        subtitle="All-time across drills"
        icon="🎯"
      />
      <StatsCard 
        title="Accuracy"
        value={`${stats.totals.accuracy}%`}
        subtitle={`${stats.totals.correctAttempts} correct`}
        icon="📈"
      />
      <StatsCard 
        title="Current Streak" 
        value={`${stats.totals.streakDays} day${stats.totals.streakDays === 1 ? '' : 's'}`}
        subtitle="Based on daily activity"
        icon="🔥"
      />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[0,1,2].map((i) => (
        <div key={i} className="rounded-xl p-6 border border-[color:var(--brand-line)] bg-[color:var(--brand-panel)]">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="text-center space-y-2 md:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[color:var(--brand-text)] tracking-tight">
            Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[color:var(--brand-muted)] max-w-2xl mx-auto">
            Continue your ear training journey with interval recognition, chord identification, and progression analysis.
          </p>
        </div>

        {/* Stats overview with skeleton */}
        <div className="md:hidden">
          <div className="grid grid-cols-3 gap-2">
            <Suspense fallback={<StatsSkeleton />}> 
              {/* Compact mobile: reuse StatsSection but CSS shrinks via StatsCard */}
              <StatsSection userId={session.user.id as string} />
            </Suspense>
          </div>
        </div>
        <div className="hidden md:block">
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection userId={session.user.id as string} />
          </Suspense>
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


