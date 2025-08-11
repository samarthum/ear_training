import * as React from "react"
import { Container } from "./Container"
import { Reveal } from "./Reveal"

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-[color:var(--brand-line)] bg-[color:var(--brand-panel)] p-4 shadow-[var(--brand-shadow)]">
      <div className="font-bold text-[color:var(--brand-accent)] tracking-tight">{n}</div>
      <h3 className="text-[18px] font-semibold my-1">{title}</h3>
      <p className="text-[14px] text-[color:var(--brand-muted)] m-0">{children}</p>
    </div>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="py-14">
      <Container>
        <h2 className="text-[24px] font-semibold tracking-tight mb-4">How it works</h2>
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            <Step n="01" title="Begin in key">Hear a calm drone + I chord to center your ear.</Step>
            <Step n="02" title="Quick prompts">Identify intervals, triads, or a short progression.</Step>
            <Step n="03" title="Light adaptivity">We interleave topics and float difficulty to keep you challenged.</Step>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}


