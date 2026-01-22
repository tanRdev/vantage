import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/20 text-primary-foreground",
        secondary: "border-transparent bg-secondary/50 text-secondary-foreground",
        destructive: "border-transparent bg-status-critical/20 text-status-critical",
        outline: "text-foreground border-border/50",
        success: "border-transparent bg-status-success/20 text-status-success",
        warning: "border-transparent bg-status-warning/20 text-status-warning",
        purple: "border-transparent bg-status-purple/20 text-status-purple",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
