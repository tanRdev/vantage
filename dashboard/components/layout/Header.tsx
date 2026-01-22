'use client'

import Link from 'next/link'
import { ThemeToggle } from '../theme-toggle'
import { Activity } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <Link href="/" className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Vantage
            </h1>
          </Link>
        </div>
        <nav className="flex items-center gap-6" aria-label="Main navigation">
          <Link
            href="/"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/treemap"
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Treemap
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
