import type { Metadata } from "next"
import { Navbar } from "@/components/marketing/Navbar"
import { Hero } from "@/components/marketing/Hero"
import { Features } from "@/components/marketing/Features"
import { DemoPanel } from "@/components/marketing/DemoPanel"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { PreviewScreen } from "@/components/marketing/PreviewScreen"
import { Pricing } from "@/components/marketing/Pricing"
import { WaitlistForm } from "@/components/marketing/WaitlistForm"
import { FAQ } from "@/components/marketing/FAQ"
import { Footer } from "@/components/marketing/Footer"

export const metadata: Metadata = {
  title: "Ear Training — Fast, Zen, and Musically Real",
  description:
    "A minimal, game-like ear-training app for singers & instrumentalists. Always starts with tonal context. Intervals, triads, and common progressions.",
  openGraph: {
    title: "Ear Training — Fast, Zen, and Musically Real",
    description:
      "Always starts with tonal context. Intervals, triads, and common progressions. Zen, modern design.",
    type: "website",
  },
}

export default function Marketing() {
  return (
    <main id="top" className="marketing-grid-overlay">
      <Navbar />
      <Hero />
      <Features />
      <DemoPanel />
      <HowItWorks />
      <PreviewScreen />
      <Pricing />
      <WaitlistForm />
      <FAQ />
      <Footer />
    </main>
  )
}


