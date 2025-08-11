import * as React from "react"
import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid place-items-center rounded-full shadow-[var(--brand-shadow)]",
        "size-7",
        className
      )}
      style={{
        background:
          "conic-gradient(from 180deg at 50% 50%, rgba(45,212,191,0.35), rgba(14,165,165,0.75))",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className="size-4 opacity-90 text-[color:var(--brand-text)]"
      >
        <path
          d="M3 12c6-8 12 8 18 0"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  )
}


