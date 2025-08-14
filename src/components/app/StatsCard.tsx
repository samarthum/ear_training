import * as React from "react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      "rounded-xl p-3 md:p-6 border border-[color:var(--brand-line)]",
      "bg-[color:var(--brand-panel)] backdrop-blur-sm",
      "hover:shadow-[var(--brand-shadow)] transition-all duration-200",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs md:text-sm font-medium text-[color:var(--brand-muted)] uppercase tracking-wide">
          {title}
        </h3>
        {icon && (
          <div className="text-xl opacity-60" aria-hidden>
            {icon}
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-lg md:text-2xl font-bold text-[color:var(--brand-text)]">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] md:text-xs text-[color:var(--brand-muted)]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}