import * as React from "react"
import { Skeleton } from "./skeleton"
import { cn } from "@/lib/utils"

export interface LoadingSkeletonProps {
  count?: number
  className?: string
}

function LoadingSkeleton({ count = 1, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export { LoadingSkeleton }
