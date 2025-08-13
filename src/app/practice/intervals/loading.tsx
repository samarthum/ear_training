import { AppLayout } from "@/components/app/AppLayout"
import { Skeleton } from "@/components/ui/skeleton"

export default function IntervalsLoading() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="text-center py-2 border-b border-[color:var(--brand-line)]">
          <Skeleton className="h-5 w-40 mx-auto" />
          <div className="mt-2"><Skeleton className="h-3 w-64 mx-auto" /></div>
        </div>
        <div className="flex-1 flex flex-col items-center p-3">
          <div className="rounded-lg border border-[color:var(--brand-line)] p-4 max-w-2xl w-full bg-[color:var(--brand-panel)]">
            <div className="text-center mb-6">
              <Skeleton className="h-10 w-56 mx-auto" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}


