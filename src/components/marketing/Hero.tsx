import * as React from "react"
import { Container } from "./Container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Hero() {
  return (
    <section className="marketing-hero-bg marketing-grid-overlay text-center py-20 sm:py-24">
      <Container>
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="size-1.5 rounded-full" style={{ background: "var(--brand-accent)" }} />
          <Badge variant="brand">Ultra‑minimal, musically real</Badge>
        </div>
        <h1 className="text-balance text-[clamp(34px,6vw,64px)] font-bold tracking-tight leading-[1.05]">
          Train your ears. <br /> In minutes, not months.
        </h1>
        <p className="mx-auto max-w-[800px] text-[color:var(--brand-muted)] text-[clamp(16px,2.2vw,20px)] mt-3">
          A calm, game‑like ear‑training app for singers & instrumentalists. Every session begins with
          <strong> tonal context</strong> (drone + I chord), then lightly adapts as you practice
          <strong> intervals</strong>, <strong>triads</strong>, and <strong>common progressions</strong>.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button variant="brandPrimary" shape="pill" asChild>
            <a href="#signup">Join the waitlist</a>
          </Button>
          <Button variant="brand" shape="pill" asChild>
            <a href="#demo">Play demo (C major)</a>
          </Button>
        </div>
        <div className="mt-2 text-xs text-[color:var(--brand-muted)]">No spam. Early users get free access during beta.</div>
      </Container>
    </section>
  )
}


