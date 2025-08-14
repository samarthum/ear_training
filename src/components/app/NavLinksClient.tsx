"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinksClientProps {
  className?: string
}

export function NavLinksClient({ className }: NavLinksClientProps) {
  const pathname = usePathname()
  const isDashboard = pathname === "/" || pathname?.startsWith("/dashboard")
  const isPractice = pathname?.startsWith("/practice")

  const base = "rounded-xl px-2.5 py-1.5 transition-colors"
  const inactive = "text-[color:var(--brand-muted)] hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)]"
  const active = "bg-[color:rgba(14,165,165,0.07)] text-[color:var(--brand-text)] font-medium"

  return (
    <nav className={cn("hidden sm:flex items-center gap-1", className)} aria-label="Primary">
      <Link
        href="/dashboard"
        className={cn(base, isDashboard ? active : inactive)}
        aria-current={isDashboard ? "page" : undefined}
      >
        Dashboard
      </Link>
      <Link
        href="/practice"
        className={cn(base, isPractice ? active : inactive)}
        aria-current={isPractice ? "page" : undefined}
      >
        Practice
      </Link>
    </nav>
  )
}


