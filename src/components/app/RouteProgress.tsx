"use client"
import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function RouteProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [progress, setProgress] = React.useState(0)
  const [visible, setVisible] = React.useState(false)
  const rafRef = React.useRef<number | null>(null)
  const hideTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    // clear any pending hide timeouts when a new navigation starts
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // start
    setVisible(true)
    setProgress(10)
    // simulate progress while waiting for route to settle
    const start = performance.now()
    const tick = () => {
      setProgress((p) => {
        if (p < 90) return p + Math.max(0.5, (performance.now() - start) / 2000)
        return p
      })
      rafRef.current = window.requestAnimationFrame(tick)
    }
    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      // complete on route change commit
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setProgress(100)
      // let the bar show completion briefly, then hide
      hideTimeoutRef.current = window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
        hideTimeoutRef.current = null
      }, 250) as unknown as number
    }
    // react to both pathname and search changes
  }, [pathname, search])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        className="h-0.5 bg-[color:var(--brand-accent)] shadow-[0_1px_6px_color-mix(in_oklab,var(--brand-accent)_60%,transparent)] transition-[width] duration-150 ease-out"
      />
    </div>
  )
}

export default RouteProgress


