import { cn } from '@/lib/utils'

interface MonoTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  children: React.ReactNode
}

export function MonoText({ as = 'span', children, className, ...props }: MonoTextProps) {
  const Comp = as
  return (
    <Comp className={cn('text-all-caps tabular-nums', className)} {...props}>
      {children}
    </Comp>
  )
}
