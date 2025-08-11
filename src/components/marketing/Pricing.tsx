import * as React from "react"
import { Container } from "./Container"
import { Button } from "@/components/ui/button"
import { Reveal } from "./Reveal"

function Tier({ title, price, features }: { title: string; price: string; features: string[] }) {
  return (
    <div className="rounded-[22px] border border-[color:var(--brand-line)] bg-[color:var(--brand-panel)] p-5 shadow-[var(--brand-shadow)]">
      <h3 className="font-semibold mb-1">{title}</h3>
      <div className="text-[36px] font-bold tracking-tight">{price}</div>
      <ul className="mt-2 text-[color:var(--brand-muted)] text-sm">
        {features.map((f) => (
          <li key={f} className="py-2 border-b border-dashed border-[color:var(--brand-line)] last:border-none">
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button variant="brandPrimary" shape="pill" asChild>
          <a href="#signup">Join the waitlist</a>
        </Button>
      </div>
    </div>
  )
}

export function Pricing() {
  return (
    <section id="pricing" className="py-14">
      <Container>
        <h2 className="text-[24px] font-semibold tracking-tight mb-4">Pricing</h2>
        <Reveal>
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-12 sm:col-span-6">
              <Tier title="Early Access" price="Free" features={["Intervals · Triads · Core progressions", "Tonal context start", "Light adaptivity"]} />
            </div>
            <div className="col-span-12 sm:col-span-6">
              <Tier title="Pro (Coming later)" price="TBD" features={["Spaced review & custom keys", "Progression packs & stats", "Practice reminders"]} />
              <div className="text-[12px] text-[color:var(--brand-muted)] mt-2">Early users get a founder discount.</div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}


