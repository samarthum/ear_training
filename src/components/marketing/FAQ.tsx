import * as React from "react"
import { Container } from "./Container"
import { Reveal } from "./Reveal"

function QA({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-[16px] border border-[color:var(--brand-line)] bg-[color:var(--brand-panel)] p-4">
      <summary className="cursor-pointer font-semibold">{q}</summary>
      <p className="mt-2 text-[color:var(--brand-muted)]">{a}</p>
    </details>
  )
}

export function FAQ() {
  return (
    <section id="faq" className="py-14">
      <Container>
        <h2 className="text-[24px] font-semibold tracking-tight mb-4">FAQ</h2>
        <Reveal>
          <div className="grid gap-3">
            <QA q="Why start with a drone and I chord?" a="Because context matters. Your brain hears intervals relative to a key. We center you first to build real, musical intuition." />
            <QA q="Is this for beginners?" a="Yes. It’s gentle but not trivial. Intermediate learners can select tougher sets and faster pacing later." />
            <QA q="Will there be spaced repetition?" a="Yes—coming in Pro. The MVP focuses on excellent sessions with interleaving and light adaptivity." />
          </div>
        </Reveal>
      </Container>
    </section>
  )
}


