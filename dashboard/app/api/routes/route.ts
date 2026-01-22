import { NextRequest, NextResponse } from 'next/server'
import { getDashboardStorage } from '@/lib/storage'
import { validateQueryParams } from '@/lib/validation'
import type { RoutesResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const validation = validateQueryParams(searchParams, 50)

    if (!validation.valid) {
      const response: RoutesResponse = {
        success: false,
        error: validation.error || 'Invalid query parameters',
      }
      return NextResponse.json(response, { status: 400 })
    }

    const { branch, limit } = validation.value!

    const storage = getDashboardStorage()
    const routes = storage.getRuntimeHistory(branch, limit)

    const response: RoutesResponse = {
      success: true,
      data: routes,
      pagination: {
        total: routes.length,
        limit,
        offset: 0,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching routes:', error)
    const response: RoutesResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch routes',
    }
    return NextResponse.json(response, { status: 500 })
  }
}
