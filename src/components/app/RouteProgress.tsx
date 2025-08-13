"use client"
import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function RouteProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const searchKey = search?.toString()
  const [progress, setProgress] = React.useState(0)
  const [visible, setVisible] = React.useState(false)
  const rafRef = React.useRef<number | null>(null)
  const hideTimeoutRef = React.useRef<number | null>(null)
  const completeTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    // cancel any previous timers/raf
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current)
    if (completeTimeoutRef.current) window.clearTimeout(completeTimeoutRef.current)
    rafRef.current = null
    hideTimeoutRef.current = null
    completeTimeoutRef.current = null

    // start on navigation commit
    setVisible(true)
    setProgress(10)

    const startedAt = performance.now()
    const tick = () => {
      setProgress((p) => {
        if (p < 90) return p + Math.max(0.5, (performance.now() - startedAt) / 2000)
        return p
      })
      rafRef.current = window.requestAnimationFrame(tick)
    }
    rafRef.current = window.requestAnimationFrame(tick)

    // auto-complete shortly after commit to avoid hanging
    completeTimeoutRef.current = window.setTimeout(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      setProgress(100)
      hideTimeoutRef.current = window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
        hideTimeoutRef.current = null
      }, 250) as unknown as number
      completeTimeoutRef.current = null
    }, 600) as unknown as number

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current)
      if (completeTimeoutRef.current) window.clearTimeout(completeTimeoutRef.current)
      rafRef.current = null
      hideTimeoutRef.current = null
      completeTimeoutRef.current = null
    }
    // react to both pathname and search changes
  }, [pathname, searchKey])

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


