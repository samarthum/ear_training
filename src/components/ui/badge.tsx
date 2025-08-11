import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-accent-foreground border-border/60",
        brand:
          "border-[color:var(--brand-line)] text-[color:var(--brand-muted)] bg-[color:transparent]",
        outline:
          "border-input text-foreground",
      },
      size: {
        sm: "text-[11px] px-2 py-0.5",
        md: "text-xs px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}


