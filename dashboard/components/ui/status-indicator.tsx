import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusVariants = cva(
  "inline-flex items-center gap-2 text-xs font-medium",
  {
    variants: {
      status: {
        success: "text-status-success",
        warning: "text-status-warning",
        error: "text-status-critical",
        neutral: "text-muted-foreground",
        purple: "text-status-purple",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  }
)

const statusDotVariants = cva(
  "status-dot",
  {
    variants: {
      status: {
        success: "status-dot-success",
        warning: "status-dot-warning",
        error: "status-dot-critical",
        neutral: "bg-muted-foreground",
        purple: "status-dot-purple",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusVariants> {
  label: string
}

function StatusIndicator({
  className,
  status,
  label,
  ...props
}: StatusIndicatorProps) {
  return (
    <div className={cn(statusVariants({ status }), className)} {...props}>
      <span className={cn(statusDotVariants({ status }))} />
      <span className="text-all-caps-tight">{label}</span>
    </div>
  )
}

export { StatusIndicator, statusVariants }
