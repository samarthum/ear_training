import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps {
  className?: string
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      role="img"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export default Spinner


