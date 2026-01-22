import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, cleanup } from '@testing-library/react'
import { useSSE } from './use-sse'

describe('useSSE', () => {
  let mockEventSource: any

  beforeEach(() => {
    mockEventSource = vi.fn().mockImplementation(() => ({
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
    }))
    global.EventSource = mockEventSource as any
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('URL construction', () => {
    it('should use NEXT_PUBLIC_SSE_URL from environment when available', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SSE_URL
      process.env.NEXT_PUBLIC_SSE_URL = 'https://api.example.com'

      renderHook(() => useSSE({ channels: ['test'] }))

      expect(mockEventSource).toHaveBeenCalledWith(
        'https://api.example.com/events?channels=test'
      )

      process.env.NEXT_PUBLIC_SSE_URL = originalEnv
    })

    it('should fall back to localhost:3001 when NEXT_PUBLIC_SSE_URL is not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SSE_URL
      delete process.env.NEXT_PUBLIC_SSE_URL

      renderHook(() => useSSE({ channels: ['test'] }))

      expect(mockEventSource).toHaveBeenCalledWith(
        'http://localhost:3001/events?channels=test'
      )

      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_SSE_URL = originalEnv
      }
    })

    it('should properly encode channel names in URL', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SSE_URL
      delete process.env.NEXT_PUBLIC_SSE_URL

      renderHook(() => useSSE({ channels: ['test channel', 'special&chars=value'] }))

      expect(mockEventSource).toHaveBeenCalledWith(
        'http://localhost:3001/events?channels=test%20channel%2Cspecial%26chars%3Dvalue'
      )

      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_SSE_URL = originalEnv
      }
    })

    it('should handle multiple channels correctly', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SSE_URL
      delete process.env.NEXT_PUBLIC_SSE_URL

      renderHook(() => useSSE({ channels: ['channel1', 'channel2', 'channel3'] }))

      expect(mockEventSource).toHaveBeenCalledWith(
        'http://localhost:3001/events?channels=channel1%2Cchannel2%2Cchannel3'
      )

      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_SSE_URL = originalEnv
      }
    })
  })

  describe('environment variable format', () => {
    it('should handle base URL with trailing slash', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SSE_URL
      process.env.NEXT_PUBLIC_SSE_URL = 'https://api.example.com/'

      renderHook(() => useSSE({ channels: ['test'] }))

      expect(mockEventSource).toHaveBeenCalledWith(
        'https://api.example.com/events?channels=test'
      )

      process.env.NEXT_PUBLIC_SSE_URL = originalEnv
    })

    it('should handle base URL without trailing slash', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SSE_URL
      process.env.NEXT_PUBLIC_SSE_URL = 'https://api.example.com'

      renderHook(() => useSSE({ channels: ['test'] }))

      expect(mockEventSource).toHaveBeenCalledWith(
        'https://api.example.com/events?channels=test'
      )

      process.env.NEXT_PUBLIC_SSE_URL = originalEnv
    })
  })
})
