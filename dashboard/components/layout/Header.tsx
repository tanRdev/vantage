'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MonoText } from '@/components/ui/mono-text'

export function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/treemap', label: 'Treemap' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="h-5 w-5 text-status-purple" strokeWidth={1.5} />
            <span className="absolute inset-0 bg-status-purple/20 blur-md rounded-full" />
          </div>
          <Link href="/" className="flex items-center">
            <h1 className="text-lg font-bold text-all-caps-tight">
              VANTAGE
            </h1>
          </Link>
        </div>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-all relative',
                  isActive
                    ? 'text-foreground bg-card/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <MonoText>{item.label}</MonoText>
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-px bg-status-purple shadow-[0_0_8px_hsl(var(--status-purple-glow)/0.6)]" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
