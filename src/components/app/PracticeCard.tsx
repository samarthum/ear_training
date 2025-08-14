import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PracticeCardProps {
  title: string
  description: string
  href: string
  icon?: React.ReactNode
  className?: string
  disabled?: boolean
  kicker?: string
  ctaLabel?: string
}

export function PracticeCard({ 
  title, 
  description, 
  href, 
  icon, 
  className,
  disabled = false,
  kicker,
  ctaLabel,
}: PracticeCardProps) {
  const common = (
    <div
      className={cn(
        "group relative block rounded-xl p-6 transition-all duration-200",
        "border border-[color:var(--brand-line)]",
        "bg-[color:var(--brand-panel)] backdrop-blur-sm",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-[var(--brand-shadow)] hover:scale-[1.02] hover:border-[color:color-mix(in_oklab,var(--brand-accent)_45%,var(--brand-line))]",
        className
      )}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-[color:var(--brand-text)] group-hover:text-[color:var(--brand-accent)] transition-colors">
              {title}
            </h3>
            {kicker && (
              <span className="inline-flex items-center rounded-full border border-[color:var(--brand-line)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[color:var(--brand-muted)]">
                {kicker}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[color:var(--brand-muted)] leading-relaxed">
            {description}
          </p>
          {ctaLabel && !disabled && (
            <div className="mt-3 text-sm font-medium text-[color:var(--brand-accent)]">{ctaLabel}</div>
          )}
        </div>
      </div>
    </div>
  );

  if (disabled) {
    return common;
  }

  return (
    <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-accent)] rounded-xl">
      {common}
    </Link>
  )
}