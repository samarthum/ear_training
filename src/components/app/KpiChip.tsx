import * as React from "react";
import { cn } from "@/lib/utils";

interface KpiChipProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
  ariaLabel?: string;
}

export function KpiChip({ icon, label, value, className, ariaLabel }: KpiChipProps) {
  return (
    <div
      aria-label={ariaLabel ?? `${label}: ${value}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-line)]",
        "bg-[color:var(--brand-panel)] px-3 py-2 shadow-sm",
        "text-[color:var(--brand-text)] text-sm whitespace-nowrap",
        className
      )}
    >
      {icon && <span aria-hidden className="text-[color:var(--brand-muted)]">{icon}</span>}
      <span className="text-[color:var(--brand-muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}


