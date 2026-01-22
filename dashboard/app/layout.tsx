import type { Metadata } from "next"
import "./globals.css"
import { Header } from "../components/layout/Header"
import { Footer } from "../components/layout/Footer"
import { ThemeProvider } from "../components/theme-provider"

export const metadata: Metadata = {
  title: "Vantage - Performance Monitoring Dashboard",
  description: "Monitor your application's performance and bundle size over time",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1" id="main-content">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
