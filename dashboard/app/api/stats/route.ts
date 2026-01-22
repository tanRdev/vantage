import { NextResponse } from 'next/server'
import { getDashboardStorage } from '@/lib/storage'
import type { StatsResponse } from '@/types/api'

export async function GET() {
  try {
    const storage = getDashboardStorage()
    const stats = storage.getStats()

    // Get latest metrics
    const runtimeHistory = storage.getRuntimeHistory('main', 1)
    const bundleHistory = storage.getBundleHistory('main', 1)

    const latestMetrics = runtimeHistory[0]
    const latestBundle = bundleHistory[0]

    const response: StatsResponse = {
      success: true,
      data: {
        ...stats,
        latestMetrics: latestMetrics
          ? {
              lcp: latestMetrics.lcp,
              inp: latestMetrics.inp,
              cls: latestMetrics.cls,
              score: latestMetrics.score,
            }
          : undefined,
        latestBundleSize: latestBundle?.newSize,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching stats:', error)
    const response: StatsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
