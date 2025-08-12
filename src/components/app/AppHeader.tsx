import 'server-only'
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/marketing/BrandMark"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"

interface AppHeaderProps {
  className?: string
}

export async function AppHeader({ className }: AppHeaderProps) {
  const session = await auth()
  
  return (
    <header className={cn("sticky top-0 z-20 border-b border-[color:var(--brand-line)]", className)}>
      <div
        className={cn(
          "mx-auto w-[min(1120px,92vw)] flex items-center justify-between gap-4",
          "py-3 backdrop-blur-md bg-brand-header",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="Ear Training dashboard"
          className="inline-flex items-center gap-2 text-[color:var(--brand-text)]"
        >
          <BrandMark />
          <span className="font-semibold tracking-tight">Ear Training</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-[color:var(--brand-muted)]" aria-label="Primary">
          <Link 
            className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)] transition-colors" 
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link 
            className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)] transition-colors" 
            href="/practice/intervals"
          >
            Intervals
          </Link>
          <Link 
            className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)] transition-colors" 
            href="/practice/chords"
          >
            Chords
          </Link>
          <Link 
            className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)] transition-colors" 
            href="/practice/progressions"
          >
            Progressions
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session?.user?.name && (
            <span className="text-sm text-[color:var(--brand-muted)] hidden sm:inline">
              {session.user.name}
            </span>
          )}
          <Button variant="brand" shape="pill" size="sm" asChild>
            <Link href="/api/auth/signout">Sign out</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}