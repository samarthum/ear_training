import * as React from "react"
import { cn } from "@/lib/utils"
import { AppHeader } from "./AppHeader"

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-brand">
      <AppHeader />
      <main className={cn(
        "mx-auto w-[min(1120px,92vw)] py-4 sm:py-6 md:py-8",
        "text-[color:var(--brand-text)]",
        className
      )}>
        {children}
      </main>
    </div>
  )
}