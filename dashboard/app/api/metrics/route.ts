import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStorage } from '@/lib/storage'
import { validateQueryParams } from '@/lib/validation'
import type { MetricsResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const validation = validateQueryParams(searchParams, 30)

    if (!validation.valid) {
      const response: MetricsResponse = {
        success: false,
        error: validation.error || 'Invalid query parameters',
      }
      return NextResponse.json(response, { status: 400 })
    }

    const { branch = 'main', limit } = validation.value!

    const storage = getDashboardStorage()

    // Get trends for all metrics
    const [lcp, inp, cls, fcp, ttfb, score] = [
      storage.getRuntimeTrend(branch, 'lcp', limit),
      storage.getRuntimeTrend(branch, 'inp', limit),
      storage.getRuntimeTrend(branch, 'cls', limit),
      storage.getRuntimeTrend(branch, 'fcp', limit),
      storage.getRuntimeTrend(branch, 'ttfb', limit),
      storage.getRuntimeTrend(branch, 'score', limit),
    ]

    // Format data with human-readable dates
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }

    const formatTrend = (trend: typeof lcp) =>
      trend.map((point) => ({
        ...point,
        date: formatDate(point.timestamp),
      }))

    const response: MetricsResponse = {
      success: true,
      data: {
        lcp: formatTrend(lcp),
        inp: formatTrend(inp),
        cls: formatTrend(cls),
        fcp: formatTrend(fcp),
        ttfb: formatTrend(ttfb),
        score: formatTrend(score),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    const response: MetricsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch metrics',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
