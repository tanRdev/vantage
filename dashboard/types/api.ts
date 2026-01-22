// API Response Types

export interface RuntimeMetric {
  id: number
  timestamp: number
  branch: string
  commit?: string
  lcp?: number
  inp?: number
  cls?: number
  fcp?: number
  ttfb?: number
  score?: number
  status: 'pass' | 'warn' | 'fail'
}

export interface BundleMetric {
  id: number
  timestamp: number
  branch: string
  commit?: string
  chunkName: string
  oldSize?: number
  newSize: number
  delta: number
  status: 'pass' | 'warn' | 'fail'
}

export interface CheckRecord {
  id: number
  timestamp: number
  branch: string
  commit?: string
  checkType: 'runtime' | 'bundle' | 'full'
  status: 'pass' | 'warn' | 'fail'
  duration: number
}

export interface TrendDataPoint {
  timestamp: number
  value: number
  date?: string
}

export interface MetricsResponse {
  success: boolean
  data?: {
    lcp: TrendDataPoint[]
    inp: TrendDataPoint[]
    cls: TrendDataPoint[]
    fcp: TrendDataPoint[]
    ttfb: TrendDataPoint[]
    score: TrendDataPoint[]
  }
  error?: string
}

export interface BundlesResponse {
  success: boolean
  data?: BundleMetric[]
  error?: string
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}

export interface RoutesResponse {
  success: boolean
  data?: RuntimeMetric[]
  error?: string
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}

export interface BuildsResponse {
  success: boolean
  data?: CheckRecord[]
  error?: string
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}

export interface StatsResponse {
  success: boolean
  data?: {
    runtimeMetricsCount: number
    bundleMetricsCount: number
    checkRecordsCount: number
    branches: string[]
    latestMetrics?: {
      lcp?: number
      inp?: number
      cls?: number
      score?: number
    }
    latestBundleSize?: number
  }
  error?: string
}

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

export interface QueryParams {
  branch?: string
  limit?: number
  offset?: number
  startDate?: number
  endDate?: number
  metric?: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb' | 'score'
}

export interface ApiError {
  message: string
  status?: number
}
