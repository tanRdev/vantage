import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { BundleTreemap } from './BundleTreemap'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  api: {
    getBundles: vi.fn(() =>
      Promise.resolve({
        success: true,
        data: [
          { chunkName: 'main', newSize: 500000 },
          { chunkName: 'vendor', newSize: 300000 },
          { chunkName: 'common', newSize: 150000 },
        ],
      })
    ),
  },
}))

describe('BundleTreemap', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('component rendering', () => {
    it('should render without errors', async () => {
      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Component should render successfully
      expect(document.body).toBeTruthy()
    })

    it('should show loading spinner initially', () => {
      const { container } = render(<BundleTreemap />)

      // Loading spinner should be present
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
    })

    it('should display treemap after data loads', async () => {
      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      // Should have the treemap container
      const treemapContainer = document.querySelector('[role="application"]')
      expect(treemapContainer).toBeTruthy()
    })
  })

  describe('data fetching', () => {
    it('should fetch bundle data on mount', async () => {
      const { api } = await import('@/lib/api-client')

      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(api.getBundles).toHaveBeenCalledWith({ limit: 100 })
    })
  })

  describe('responsive behavior', () => {
    it('should handle window resize gracefully', async () => {
      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Simulate window resize - should not throw
      await act(async () => {
        window.dispatchEvent(new Event('resize'))
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Component should still be intact
      const treemapContainer = document.querySelector('[role="application"]')
      expect(treemapContainer).toBeTruthy()
    })
  })

  describe('cleanup', () => {
    it('should cleanup on unmount without errors', async () => {
      let unmountFn: (() => void) | undefined

      await act(async () => {
        const result = render(<BundleTreemap />)
        unmountFn = result.unmount
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Unmount should not throw
      expect(() => {
        unmountFn?.()
      }).not.toThrow()
    })
  })
})
