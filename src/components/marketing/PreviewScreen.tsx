import * as React from "react"
import { Container } from "./Container"
import { Reveal } from "./Reveal"

export function PreviewScreen() {
  return (
    <section className="py-14">
      <Container>
        <Reveal>
          <div
            className="h-[340px] rounded-[22px] border border-[color:var(--brand-line)] grid place-items-center text-[color:var(--brand-muted)]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0)), radial-gradient(1200px 500px at 50% -40%, rgba(14,165,165,0.12), transparent 60%), linear-gradient(180deg, color-mix(in oklab, var(--brand-bg) 60%, transparent), transparent)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div className="text-center">
              <div className="inline-block rounded-full border border-[color:var(--brand-line)] px-2.5 py-1 text-[12px] mb-2">
                Preview
              </div>
              <p className="max-w-[560px] text-sm">
                Clean, distraction‑free interface. Session cards, gentle feedback, simple stats.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}


