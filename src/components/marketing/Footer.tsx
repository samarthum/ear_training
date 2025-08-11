import * as React from "react"
import { Container } from "./Container"
import { BrandMark } from "./BrandMark"

export function Footer() {
  return (
    <footer className="border-t py-10 text-[color:var(--brand-muted)]">
      <Container>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span>Ear Training</span>
          </div>
          <div className="text-sm">Built with Web Audio. Tone.js powers the app.</div>
        </div>
      </Container>
    </footer>
  )
}


