import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/app/AppLayout";
import { StatsCard } from "@/components/app/StatsCard";
import { getUserStats } from "@/lib/stats";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiChip } from "@/components/app/KpiChip";
import { Target, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsChipsClient } from "@/components/app/StatsChipsClient";

async function StatsSection({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const stats = await getUserStats(userId);
  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto">
        <KpiChip icon={<Target size={16} />} label="Attempts" value={stats.totals.totalAttempts} />
        <KpiChip icon={<TrendingUp size={16} />} label="Accuracy" value={`${stats.totals.accuracy}%`} />
        <KpiChip icon={<Flame size={16} />} label="Streak" value={`${stats.totals.streakDays}d`} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard 
        title="Total Attempts"
        value={stats.totals.totalAttempts}
        subtitle={"All-time across drills"}
        icon={<Target size={18} /> as unknown as string}
      />
      <StatsCard 
        title="Accuracy"
        value={`${stats.totals.accuracy}%`}
        subtitle={`${stats.totals.correctAttempts} correct`}
        icon={<TrendingUp size={18} /> as unknown as string}
      />
      <StatsCard 
        title="Current Streak" 
        value={`${stats.totals.streakDays} day${stats.totals.streakDays === 1 ? '' : 's'}`}
        subtitle={"Based on daily activity"}
        icon={<Flame size={18} /> as unknown as string}
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
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-[color:var(--brand-text)] tracking-tight">
            Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-[color:var(--brand-muted)] max-w-xl mx-auto">
            Continue your ear training with a quick, personalized drill.
          </p>
          <div className="pt-2">
            <Button variant="brand" size="lg" asChild>
              <Link href="/practice">Start practice</Link>
            </Button>
          </div>
        </div>

        {/* Stats overview: mobile chips are client-driven with timeframe toggle; desktop keeps cards for now */}
        <div className="md:hidden">
          <StatsChipsClient />
        </div>
        <div className="hidden md:block">
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection userId={session.user.id as string} />
          </Suspense>
        </div>

        {/* Sticky bottom primary CTA for mobile */}
        <div className="md:hidden fixed bottom-4 inset-x-0 flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <Button variant="brand" size="lg" asChild>
              <Link href="/practice">Start practice</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}


