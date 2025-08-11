"use client"
import * as React from "react"
import { Container } from "./Container"
import { Button } from "@/components/ui/button"

export function WaitlistForm() {
  const [message, setMessage] = React.useState<string>("")
  const formRef = React.useRef<HTMLFormElement | null>(null)

  function handleSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const fd = new FormData(ev.currentTarget)
    const email = String(fd.get("email") || "").trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email.")
      return
    }
    try {
      const list = JSON.parse(localStorage.getItem("waitlist") || "[]") as string[]
      if (!list.includes(email)) list.push(email)
      localStorage.setItem("waitlist", JSON.stringify(list))
      setMessage("You're on the list. Thank you!")
      formRef.current?.reset()
    } catch {
      setMessage("Saved locally. Thank you!")
    }
  }

  return (
    <section id="signup" className="py-14">
      <Container>
        <div className="rounded-[24px] border border-[color:var(--brand-line)] bg-[linear-gradient(180deg,rgba(14,165,165,0.06),transparent_55%)] p-6">
          <h2 className="text-[22px] font-semibold tracking-tight mb-1">Get early access</h2>
          <p className="text-[color:var(--brand-muted)] mb-4">Drop your email. We’ll invite a small batch first. You can unsubscribe any time.</p>
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="you@music.com"
              aria-label="Email"
              className="min-w-[180px] flex-1 rounded-[14px] border border-[color:var(--brand-line)] bg-[color:var(--brand-panel)] px-3.5 py-2.5 text-[color:var(--brand-text)]"
            />
            <Button variant="brandPrimary" shape="pill" type="submit">
              Join
            </Button>
          </form>
          <div className="text-[12px] text-[color:var(--brand-muted)] mt-2" role="status" aria-live="polite" style={{ minHeight: "1.2em" }}>
            {message}
          </div>
        </div>
      </Container>
    </section>
  )
}


