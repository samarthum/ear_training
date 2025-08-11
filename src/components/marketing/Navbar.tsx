import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BrandMark } from "./BrandMark"
import { Button } from "@/components/ui/button"

export function Navbar({ className }: { className?: string }) {
  return (
    <header className={cn("sticky top-0 z-20 border-b", className)}>
      <div
        className={cn(
          "mx-auto w-[min(1120px,92vw)] flex items-center justify-between gap-4",
          "py-3 backdrop-blur-md",
        )}
        style={{
          background: "color-mix(in oklab, var(--brand-bg) 75%, transparent)",
        }}
      >
        <Link
          href="#top"
          aria-label="Ear Training home"
          className="inline-flex items-center gap-2 text-[color:var(--brand-text)]"
        >
          <BrandMark />
          <span className="font-semibold tracking-tight">Ear Training</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 text-[color:var(--brand-muted)]" aria-label="Primary">
          <a className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)]" href="#features">Features</a>
          <a className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)]" href="#how">How it works</a>
          <a className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)]" href="#pricing">Pricing</a>
          <a className="rounded-xl px-2.5 py-1.5 hover:bg-[color:rgba(14,165,165,0.07)] hover:text-[color:var(--brand-text)]" href="#faq">FAQ</a>
        </nav>

        <Button variant="brandPrimary" shape="pill" asChild>
          <a href="#signup">Get early access</a>
        </Button>
      </div>
    </header>
  )
}


