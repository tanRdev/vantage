import { Activity } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-primary" />
          <p className="font-medium text-foreground">
            Vantage
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Performance budget enforcement for Next.js applications
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Built with Next.js 15, TypeScript, and Tailwind CSS
        </p>
      </div>
    </footer>
  )
}
