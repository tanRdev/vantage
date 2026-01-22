import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        error: "bg-error/10 text-error border border-error/20",
        neutral: "bg-muted text-muted-foreground border border-border",
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
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full animate-pulse",
          status === "success" && "bg-success",
          status === "warning" && "bg-warning",
          status === "error" && "bg-error",
          status === "neutral" && "bg-muted-foreground"
        )}
      />
      {label}
    </div>
  )
}

export { StatusIndicator, statusVariants }
