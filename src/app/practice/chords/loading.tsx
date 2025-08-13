import { AppLayout } from "@/components/app/AppLayout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ChordsLoading() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="text-center py-2 border-b border-[color:var(--brand-line)]">
          <Skeleton className="h-5 w-48 mx-auto" />
          <div className="mt-2"><Skeleton className="h-3 w-64 mx-auto" /></div>
        </div>
        <div className="p-6 max-w-2xl mx-auto">
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </AppLayout>
  )
}


