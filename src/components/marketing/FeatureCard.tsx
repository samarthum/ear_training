import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"

export function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="bg-[color:var(--brand-panel)] border-[color:var(--brand-line)] rounded-[22px] p-5 shadow-[var(--brand-shadow)]">
      <CardContent className="p-0">
        <div className="inline-grid place-items-center size-7 mb-1">{icon}</div>
        <h3 className="text-[18px] font-semibold mb-1">{title}</h3>
        <p className="text-[14px] text-[color:var(--brand-muted)] m-0">{children}</p>
      </CardContent>
    </Card>
  )
}


