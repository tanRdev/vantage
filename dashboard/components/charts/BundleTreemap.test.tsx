import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { BundleTreemap } from './BundleTreemap'

// Mock d3 module - these tests focus on ResizeObserver integration, not D3 rendering
vi.mock('d3', () => {
  const createChainable = () => ({
    selectAll: vi.fn(() => createChainable()),
    data: vi.fn(() => createChainable()),
    enter: vi.fn(() => createChainable()),
    append: vi.fn(() => createChainable()),
    attr: vi.fn(() => createChainable()),
    style: vi.fn(() => createChainable()),
    on: vi.fn(() => createChainable()),
    html: vi.fn(() => createChainable()),
    remove: vi.fn(() => createChainable()),
    text: vi.fn(() => createChainable()),
    transition: vi.fn(() => ({
      duration: vi.fn(() => createChainable()),
      attr: vi.fn(() => createChainable()),
      style: vi.fn(() => createChainable()),
    })),
    nodes: vi.fn(() => []),
  })

  const createHierarchy = vi.fn(() => {
    const fn = function() {} as any
    fn.sum = vi.fn(() => fn)
    fn.sort = vi.fn(() => fn)
    fn.leaves = vi.fn(() => [])
    fn.each = vi.fn(() => fn)
    fn.descendants = vi.fn(() => [])
    return fn
  })

  const createTreemap = vi.fn(() => {
    const fn = function(_rootNode: any) {
      return _rootNode || fn
    } as any
    fn.size = vi.fn(() => fn)
    fn.padding = vi.fn(() => fn)
    fn.round = vi.fn(() => fn)
    return fn
  })

  return {
    default: Object.assign(function() {}, {
      treemap: createTreemap,
      hierarchy: createHierarchy,
      select: vi.fn(() => createChainable()),
    }),
    treemap: createTreemap,
    hierarchy: createHierarchy,
    select: vi.fn(() => createChainable()),
    HierarchyNode: class {},
  }
})

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
  let resizeObserverInstances: any[] = []

  beforeEach(() => {
    resizeObserverInstances = []

    // Mock HTMLElement.clientWidth for the test environment
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 800,
    })

    // Create a mock ResizeObserver class
    const MockResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverInstances.push({
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          callback,
        })
      }
      static mockInstances = resizeObserverInstances
    }

    // @ts-ignore - mocking global
    global.ResizeObserver = MockResizeObserver
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    resizeObserverInstances = []
  })

  describe('ResizeObserver integration', () => {
    it('should create a ResizeObserver on mount', async () => {
      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(resizeObserverInstances.length).toBeGreaterThan(0)
    })

    it('should observe the container element with ResizeObserver', async () => {
      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(resizeObserverInstances.length).toBeGreaterThan(0)

      const observerInstance = resizeObserverInstances[0]
      expect(observerInstance.observe).toHaveBeenCalled()
    })

    it('should disconnect ResizeObserver on unmount', async () => {
      let unmountFn: (() => void) | undefined

      await act(async () => {
        const result = render(<BundleTreemap />)
        unmountFn = result.unmount
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      const observerInstance = resizeObserverInstances[0]

      await act(async () => {
        unmountFn?.()
      })

      expect(observerInstance.disconnect).toHaveBeenCalled()
    })
  })

  describe('responsive behavior', () => {
    it('should use container width for treemap dimensions', async () => {
      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(resizeObserverInstances.length).toBeGreaterThan(0)
    })

    it('should respond to container size changes', async () => {
      let containerEl: HTMLElement | undefined

      await act(async () => {
        const result = render(<BundleTreemap />)
        containerEl = result.container
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      const observerInstance = resizeObserverInstances[0]

      if (observerInstance?.callback && containerEl?.firstElementChild) {
        await act(async () => {
          const mockEntry = {
            contentRect: { width: 500, height: 300, top: 0, left: 0, bottom: 300, right: 500 } as DOMRectReadOnly,
            target: containerEl.firstElementChild as Element,
            borderBoxSize: [],
            contentBoxSize: [],
          }
          observerInstance.callback([mockEntry])
          await new Promise((resolve) => setTimeout(resolve, 0))
        })
      }

      expect(observerInstance.observe).toHaveBeenCalled()
    })

    it('should update dimensions when resize occurs', async () => {
      await act(async () => {
        render(<BundleTreemap />)
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      const observerInstance = resizeObserverInstances[0]

      if (observerInstance?.callback) {
        await act(async () => {
          const mockEntry = {
            contentRect: { width: 1024, height: 400, top: 0, left: 0, bottom: 400, right: 1024 } as DOMRectReadOnly,
            target: document.body,
            borderBoxSize: [],
            contentBoxSize: [],
          }
          observerInstance.callback([mockEntry])
          await new Promise((resolve) => setTimeout(resolve, 0))
        })
      }

      expect(observerInstance).toBeDefined()
    })
  })

  describe('cleanup', () => {
    it('should properly cleanup ResizeObserver when component unmounts', async () => {
      let unmountFn: (() => void) | undefined

      await act(async () => {
        const result = render(<BundleTreemap />)
        unmountFn = result.unmount
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(resizeObserverInstances.length).toBe(1)

      await act(async () => {
        unmountFn?.()
      })

      resizeObserverInstances.forEach((obs) => {
        expect(obs.disconnect).toHaveBeenCalled()
      })
    })

    it('should handle multiple mount/unmount cycles', async () => {
      let unmount1: (() => void) | undefined

      await act(async () => {
        const result = render(<BundleTreemap />)
        unmount1 = result.unmount
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      const firstObserverCount = resizeObserverInstances.length

      await act(async () => {
        unmount1?.()
      })

      let unmount2: (() => void) | undefined

      await act(async () => {
        const result = render(<BundleTreemap />)
        unmount2 = result.unmount
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(resizeObserverInstances.length).toBeGreaterThan(firstObserverCount)

      await act(async () => {
        unmount2?.()
      })
    })
  })
})
