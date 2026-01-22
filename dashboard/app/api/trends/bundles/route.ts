import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStorage } from '@/lib/storage'
import { validateQueryParams } from '@/lib/validation'

export interface BundleTrendDataPoint {
  timestamp: number
  value: number
  date?: string
}

export interface BundleTrendsResponse {
  success: boolean
  data?: Record<string, BundleTrendDataPoint[]>
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const validation = validateQueryParams(searchParams, 50)

    if (!validation.valid) {
      const response: BundleTrendsResponse = {
        success: false,
        error: validation.error || 'Invalid query parameters',
      }
      return NextResponse.json(response, { status: 400 })
    }

    const { branch = 'main', limit } = validation.value!

    const storage = getDashboardStorage()

    // Get all bundle trends grouped by chunk name
    const allTrends = storage.getAllBundleTrends(branch, limit * 10)

    // Group by chunk name and get the latest N points for each
    const trendsByChunk: Record<string, Array<{ timestamp: number; value: number }>> = {}

    for (const trend of allTrends) {
      if (!trendsByChunk[trend.chunkName]) {
        trendsByChunk[trend.chunkName] = []
      }
      if (trendsByChunk[trend.chunkName].length < limit) {
        trendsByChunk[trend.chunkName].push({
          timestamp: trend.timestamp,
          value: trend.value,
        })
      }
    }

    // Sort each chunk's trends by timestamp ascending
    for (const chunk in trendsByChunk) {
      trendsByChunk[chunk].sort((a, b) => a.timestamp - b.timestamp)
    }

    // Format data with human-readable dates
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }

    const formattedData: Record<string, BundleTrendDataPoint[]> = {}
    for (const chunk in trendsByChunk) {
      formattedData[chunk] = trendsByChunk[chunk].map(point => ({
        ...point,
        date: formatDate(point.timestamp),
      }))
    }

    const response: BundleTrendsResponse = {
      success: true,
      data: formattedData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching bundle trends:', error)
    const response: BundleTrendsResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bundle trends',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
