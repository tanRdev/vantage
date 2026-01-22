'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { api } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

interface TreemapNode {
  name: string
  value: number
}

interface HierarchyData {
  name: string
  children: TreemapNode[]
  value: number
}

type D3HierarchyNode = d3.HierarchyRectangularNode<HierarchyData>

const DEFAULT_HEIGHT = 400
const MIN_WIDTH = 300

export function BundleTreemap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null)
  const [data, setData] = useState<TreemapNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<D3HierarchyNode | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const [dimensions, setDimensions] = useState({ width: 800, height: DEFAULT_HEIGHT })
  const nodesRef = useRef<d3.Selection<d3.BaseType | SVGRectElement, D3HierarchyNode, any, any> | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const treemapRootRef = useRef<d3.HierarchyRectangularNode<HierarchyData> | null>(null)

  useEffect(() => {
    api.getBundles({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          // Aggregate by chunk name
          const chunkMap = new Map<string, number>()
          res.data.forEach((bundle) => {
            const current = chunkMap.get(bundle.chunkName) || 0
            chunkMap.set(bundle.chunkName, current + bundle.newSize)
          })
          const aggregated = Array.from(chunkMap.entries()).map(([name, value]) => ({
            name,
            value,
          }))
          setData(aggregated)
          setError(null)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch bundle data:', err)
        setError('Failed to load bundle data. Please try again later.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Cleanup effect - ensures tooltip is always removed when data changes or component unmounts
  // This must run on data changes to handle the early return case in the main render effect
  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove()
        tooltipRef.current = null
      }
    }
  }, [data])

  // Handle container resize with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Initial dimension measurement
    const updateDimensions = () => {
      if (!container) return
      const containerWidth = Math.max(MIN_WIDTH, container.clientWidth)
      setDimensions({ width: containerWidth, height: DEFAULT_HEIGHT })
    }

    updateDimensions()

    // Set up ResizeObserver for responsive behavior
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width >= MIN_WIDTH) {
          setDimensions({ width, height: DEFAULT_HEIGHT })
        }
      }
    })

    resizeObserver.observe(container)
    resizeObserverRef.current = resizeObserver

    return () => {
      resizeObserver.disconnect()
      resizeObserverRef.current = null
    }
  }, [])

  // Render treemap when data or dimensions change
  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return

    const { width, height } = dimensions

    const treemap = d3
      .treemap<HierarchyData>()
      .size([width, height])
      .padding(2)
      .round(true)

    const rootNode = d3
      .hierarchy<HierarchyData>({ name: 'root', children: data, value: 0 })
      .sum((d) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const root = treemap(rootNode) as d3.HierarchyRectangularNode<HierarchyData>
    treemapRootRef.current = root

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Set SVG dimensions based on container size
    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`)

    // Create a group for nodes
    const g = svg.append('g')

    const nodes = g
      .selectAll<SVGRectElement, D3HierarchyNode>('.node')
      .data(root.leaves())
      .enter()
      .append('rect')
      .attr('class', 'node')
      .attr('data-index', (_d, i) => i)
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d) => getColor(d.data.value))
      .attr('stroke', 'rgba(0,0,0,0.1)')
      .attr('stroke-width', 1)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('opacity', 0.9)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${d.data.name}: ${formatBytes(d.data.value)}`)
      .on('click', function(_event, d) {
        setSelectedNode(d)
        d3.select(this).attr('stroke', 'hsl(var(--primary))').attr('stroke-width', 3)
      })
      .on('keydown', function(event: KeyboardEvent, d) {
        const index = d3.select(this).attr('data-index')
        const currentIndex = parseInt(index ?? '0', 10)

        if (event.key === 'ArrowRight') {
          event.preventDefault()
          focusNode(currentIndex + 1)
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault()
          focusNode(currentIndex - 1)
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          focusNode(currentIndex + Math.ceil(Math.sqrt(data.length)))
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          focusNode(currentIndex - Math.ceil(Math.sqrt(data.length)))
        } else if (event.key === 'Home') {
          event.preventDefault()
          focusNode(0)
        } else if (event.key === 'End') {
          event.preventDefault()
          focusNode(data.length - 1)
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setSelectedNode(d)
          d3.select(this).attr('stroke', 'hsl(var(--primary))').attr('stroke-width', 3)
        } else if (event.key === 'Escape') {
          event.preventDefault()
          setSelectedNode(null)
          d3.selectAll('.node').attr('stroke', 'rgba(0,0,0,0.1)').attr('stroke-width', 1)
        }
      })

    nodesRef.current = nodes as d3.Selection<d3.BaseType | SVGRectElement, D3HierarchyNode, any, any>

    function focusNode(index: number) {
      const allNodes = nodes.nodes() as SVGRectElement[]
      if (index >= 0 && index < allNodes.length) {
        setFocusedIndex(index)
        ;(allNodes[index] as unknown as HTMLElement).focus()
      }
    }

    const labels = g
      .selectAll<SVGTextElement, D3HierarchyNode>('.label')
      .data(root.leaves())
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => (d.x0 + d.x1) / 2)
      .attr('y', (d) => (d.y0 + d.y1) / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', 'rgba(255,255,255,0.95)')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.7)')
      .style('pointer-events', 'none')
      .text((d) => {
        const nodeWidth = d.x1 - d.x0
        const nodeHeight = d.y1 - d.y0
        return nodeWidth > 60 && nodeHeight > 30 ? d.data.name : ''
      })

    // Tooltip
    let tooltip = tooltipRef.current
    if (!tooltip) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'treemap-tooltip')
        .style('position', 'absolute')
        .style('padding', '12px 16px')
        .style('border-radius', '8px')
        .style('font-size', '13px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 100)
        .style('background', 'hsl(var(--card))')
        .style('border', '1px solid hsl(var(--border))')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
      tooltipRef.current = tooltip
    }

    nodes.on('mouseover', function(event, d) {
      d3.select(this).transition().duration(150).attr('opacity', 1)
      tooltip.transition().duration(150).style('opacity', 1)
      tooltip.html(`
        <div class="font-semibold text-foreground">${d.data.name}</div>
        <div class="text-xs text-muted-foreground mt-1">Size: <span class="text-foreground font-mono">${formatBytes(d.data.value)}</span></div>
      `)
      tooltip
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 28 + 'px')
    })

    nodes.on('mousemove', function(event) {
      tooltip
        .style('left', event.pageX + 15 + 'px')
        .style('top', event.pageY - 28 + 'px')
    })

    nodes.on('mouseout', function() {
      d3.select(this).transition().duration(150).attr('opacity', 0.9)
      tooltip.transition().duration(150).style('opacity', 0)
    })

    return () => {
      // Cleanup is handled by the tooltip cleanup effect
    }
  }, [data, dimensions])

  function getColor(size: number): string {
    const bytes = size
    if (bytes < 100 * 1024) return '#22c55e' // green
    if (bytes < 300 * 1024) return '#3b82f6' // blue
    if (bytes < 600 * 1024) return '#f59e0b' // amber
    return '#ef4444' // red
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground">Check the console for more details.</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        No bundle data available. Run <code className="mx-1">vantage check</code> to generate metrics.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Bundle Composition</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Interactive visualization of your bundle composition
            </p>
          </div>
        </div>

        {/* Keyboard instructions */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground" role="note" aria-label="Keyboard navigation instructions">
          <span className="font-medium">Keyboard navigation:</span> Use arrow keys to navigate, Enter/Space to select, Escape to deselect
        </div>

        <div
          ref={containerRef}
          className="rounded-lg border border-border overflow-hidden bg-muted/20"
          style={{ width: '100%' }}
        >
          <svg
            ref={svgRef}
            className="w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
            role="application"
            aria-label="Bundle composition treemap"
          />
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-muted-foreground">&lt; 100KB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            <span className="text-muted-foreground">100KB - 300KB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-muted-foreground">300KB - 600KB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-muted-foreground">&gt; 600KB</span>
          </div>
        </div>
      </div>
    </div>
  )
}
