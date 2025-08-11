"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Reveal({ className, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) el.classList.add("show")
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={cn("reveal", className)} {...props} />
}


