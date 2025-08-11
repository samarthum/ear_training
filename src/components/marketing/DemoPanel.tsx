import * as React from "react"
import { Container } from "./Container"
import { Button } from "@/components/ui/button"

export function DemoPanel() {
  return (
    <section id="demo" className="py-14">
      <Container>
        <div className="rounded-[24px] border border-[color:var(--brand-line)] bg-[linear-gradient(180deg,rgba(14,165,165,0.06),transparent_55%)] p-6">
          <h2 className="text-[22px] font-semibold tracking-tight mb-1">Feel the calm start</h2>
          <p className="text-[color:var(--brand-muted)] mb-4">
            Tap play to hear a short example in the app: a soft drone on C, then the I chord (C–E–G).
          </p>
          <div className="flex items-center gap-2">
            <Button variant="brandPrimary" shape="pill" disabled>
              Play demo
            </Button>
            <Button variant="brand" shape="pill" disabled>
              Stop
            </Button>
          </div>
          <div className="text-xs text-[color:var(--brand-muted)] mt-2">
            Audio demo is disabled on the static marketing page. Try it inside the app.
          </div>
        </div>
      </Container>
    </section>
  )
}


