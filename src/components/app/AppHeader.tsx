import 'server-only'
import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/marketing/BrandMark"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import { NavLinksClient } from "./NavLinksClient"
import { UserMenu } from "./UserMenu"

interface AppHeaderProps {
  className?: string
}

export async function AppHeader({ className }: AppHeaderProps) {
  const session = await auth()
  
  return (
    <header className={cn("sticky top-0 z-20 border-b border-[color:var(--brand-line)]", className)}>
      <div
        className={cn(
          "mx-auto w-[min(1120px,92vw)] relative flex items-center justify-between gap-4",
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

        <NavLinksClient className="absolute left-1/2 -translate-x-1/2" />

        <div className="flex items-center gap-2">
          <UserMenu user={session?.user ?? null} />
        </div>
      </div>
    </header>
  )
}