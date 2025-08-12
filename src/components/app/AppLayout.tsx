import * as React from "react"
import { cn } from "@/lib/utils"
import { AppHeader } from "./AppHeader"

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: "var(--brand-bg)" }}>
      <AppHeader />
      <main className={cn(
        "mx-auto w-[min(1120px,92vw)] py-8",
        "text-[color:var(--brand-text)]",
        className
      )}>
        {children}
      </main>
    </div>
  )
}