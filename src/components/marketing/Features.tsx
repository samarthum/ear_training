import * as React from "react"
import { Container } from "./Container"
import { FeatureCard } from "./FeatureCard"
import { Reveal } from "./Reveal"

const iconClass = "size-7 stroke-[1.7] text-[color:var(--brand-text)] opacity-95"

export function Features() {
  return (
    <section id="features" className="py-14">
      <Container>
        <Reveal>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 sm:col-span-4">
              <FeatureCard
                icon={
                  <svg viewBox="0 0 24 24" className={iconClass} aria-label="Tonal context" role="img">
                    <path d="M4 12a8 8 0 0 1 16 0" />
                    <rect x="4" y="12" width="4" height="6" rx="2" />
                    <rect x="16" y="12" width="4" height="6" rx="2" />
                  </svg>
                }
                title="Tonal context first"
              >
                Each quiz starts with a gentle drone and I chord so your ear locks into key before you answer.
              </FeatureCard>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <FeatureCard
                icon={
                  <svg viewBox="0 0 24 24" className={iconClass} aria-label="Interleaving" role="img">
                    <path d="M3 6h3l4.5 6L15 6h6" />
                    <path d="M19 4l2 2-2 2" />
                    <path d="M3 18h3l4.5-6L15 18h6" />
                    <path d="M19 16l2 2-2 2" />
                  </svg>
                }
                title="Interleaved & adaptive"
              >
                Small, varied prompts that nudge difficulty based on your streaks and slips. Stay in flow; avoid fatigue.
              </FeatureCard>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <FeatureCard
                icon={
                  <svg viewBox="0 0 24 24" className={iconClass} aria-label="Progressions" role="img">
                    <path d="M3 7h18M3 10h18M3 13h18" />
                    <circle cx="9" cy="13" r="1.7" />
                    <circle cx="12" cy="10" r="1.7" />
                    <circle cx="15" cy="7" r="1.7" />
                  </svg>
                }
                title="Real progressions"
              >
                Beyond trivia: drill triads and common I–IV–V, ii–V–I, and vi–IV–I–V shapes heard in actual songs.
              </FeatureCard>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}


