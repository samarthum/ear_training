import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PracticeCardProps {
  title: string
  description: string
  href: string
  icon?: string
  className?: string
}

export function PracticeCard({ 
  title, 
  description, 
  href, 
  icon, 
  className 
}: PracticeCardProps) {
  return (
    <Link 
      href={href}
      className={cn(
        "group relative block rounded-xl p-6 transition-all duration-200",
        "border border-[color:var(--brand-line)]",
        "bg-[color:var(--brand-panel)] backdrop-blur-sm",
        "hover:shadow-[var(--brand-shadow)] hover:scale-[1.02]",
        "hover:border-[color:color-mix(in_oklab,var(--brand-accent)_45%,var(--brand-line))]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[color:var(--brand-text)] mb-2 group-hover:text-[color:var(--brand-accent)] transition-colors">
            {title}
          </h3>
          <p className="text-sm text-[color:var(--brand-muted)] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}