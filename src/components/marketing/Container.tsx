import * as React from "react"
import { cn } from "@/lib/utils"

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-[min(1120px,92vw)]", className)} {...props} />
  )
}


