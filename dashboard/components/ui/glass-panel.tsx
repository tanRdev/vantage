import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  highlight?: boolean
}

export function GlassPanel({ children, className, highlight = false }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-lg',
        'bg-card/60 backdrop-blur-md',
        'border border-border/50',
        'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none before:z-0',
        'relative',
        highlight && 'border-t border-border-highlight/50',
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}
