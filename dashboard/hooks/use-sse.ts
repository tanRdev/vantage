'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface SSEMessage<T = unknown> {
  channel?: string
  type: string
  data?: T
  clientId?: string
  channels?: string[]
}

interface UseSSEOptions {
  channels: string[]
  enabled?: boolean
}

interface UseSSEReturn<T> {
  data: T | null
  connected: boolean
  error: string | null
  reconnect: () => void
}

export function useSSE<T = unknown>(options: UseSSEOptions): UseSSEReturn<T> {
  const { channels, enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (!enabled) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    setError(null)
    setConnected(false)

    try {
      const channelsParam = encodeURIComponent(channels.join(','))
      const baseUrl = (process.env.NEXT_PUBLIC_SSE_URL || 'http://localhost:3001').replace(/\/$/, '')
      const url = `${baseUrl}/events?channels=${channelsParam}`
      const eventSource = new EventSource(url)

      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setConnected(true)
        setError(null)
      }

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage<T> = JSON.parse(event.data)

          if (message.type === 'connected') {
            console.log('[SSE] Connected:', message.clientId)
            return
          }

          if (message.type === 'update' && message.data) {
            setData(message.data)
          }
        } catch (err) {
          console.error('[SSE] Error parsing message:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('[SSE] Connection error:', err)
        setConnected(false)
        setError('Connection error')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setConnected(false)
    }
  }, [channels, enabled])

  const reconnect = useCallback(() => {
    connect()
  }, [connect])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [connect])

  return { data, connected, error, reconnect }
}
