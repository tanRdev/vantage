import type {
  MetricsResponse,
  BundlesResponse,
  RoutesResponse,
  BuildsResponse,
  StatsResponse,
  QueryParams,
} from '@/types/api'

const API_BASE = '/api'

async function fetchWithErrorHandling<T>(
  url: string,
  params?: QueryParams
): Promise<T> {
  const queryString =
    params && Object.keys(params).length > 0
      ? '?' +
        new URLSearchParams(
          Object.entries(params).filter(
            ([_, v]) => v !== undefined && v !== null
          ) as [string, string][]
        ).toString()
      : ''

  const response = await fetch(`${API_BASE}${url}${queryString}`)

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  getMetrics: async (params?: QueryParams): Promise<MetricsResponse> => {
    return fetchWithErrorHandling<MetricsResponse>('/metrics', params)
  },

  getBundles: async (params?: QueryParams): Promise<BundlesResponse> => {
    return fetchWithErrorHandling<BundlesResponse>('/bundles', params)
  },

  getRoutes: async (params?: QueryParams): Promise<RoutesResponse> => {
    return fetchWithErrorHandling<RoutesResponse>('/routes', params)
  },

  getBuilds: async (params?: QueryParams): Promise<BuildsResponse> => {
    return fetchWithErrorHandling<BuildsResponse>('/builds', params)
  },

  getStats: async (): Promise<StatsResponse> => {
    return fetchWithErrorHandling<StatsResponse>('/stats')
  },
}
