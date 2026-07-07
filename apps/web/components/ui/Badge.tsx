import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: "HOT" | "WARM" | "COLD" | "TRANSFERRED" | "ABANDONED" | "DEFAULT"
}

const variants = {
  HOT:         'bg-success/10 text-success border-success/20',
  WARM:        'bg-warning/10 text-warning border-warning/20',
  COLD:        'bg-secondary/10 text-secondary border-secondary/20',
  TRANSFERRED: 'bg-primary-light/10 text-primary-light border-primary-light/20',
  ABANDONED:   'bg-gray-100 text-gray-500 border-gray-200',
  // Generic fallback
  DEFAULT:     'bg-surface text-secondary border-secondary/20',
}

function Badge({ className, tier = "DEFAULT", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        variants[tier],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
