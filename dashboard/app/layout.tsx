import type { Metadata } from "next"
import "./globals.css"
import { ibmPlexMono } from "./fonts"
import { Header } from "../components/layout/Header"
import { Footer } from "../components/layout/Footer"

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
    <html lang="en" className={ibmPlexMono.variable}>
      <body className="antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1" id="main-content">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
