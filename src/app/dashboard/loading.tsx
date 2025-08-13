import { AppLayout } from "@/components/app/AppLayout"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto"><Skeleton className="h-8 w-64 mx-auto" /></div>
          <Skeleton className="h-4 w-[520px] max-w-full mx-auto" />
        </div>

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

        <div className="space-y-4">
          <Skeleton className="h-6 w-56 mx-auto" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[0,1,2].map((i) => (
              <div key={i} className="rounded-xl p-6 border border-[color:var(--brand-line)] bg-[color:var(--brand-panel)] h-[140px]" />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}


