"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
}

export function BundleTreemap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  const data: TreemapNode = {
    name: "Bundle",
    value: 0,
    children: [
      {
        name: "main.js",
        value: 120 * 1024,
      },
      {
        name: "vendor.js",
        value: 85 * 1024,
      },
      {
        name: "app.js",
        value: 40 * 1024,
      },
    ],
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    const treemap = d3
      .treemap()
      .size([width, height])
      .padding(2)
      .round(true);

    const root = d3
      .hierarchy(data)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    treemap(root);

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    const nodes = svg
      .selectAll(".node")
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr("class", "node")
      .attr("x", (d: any) => d.x0)
      .attr("y", (d: any) => d.y0)
      .attr("width", (d: any) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d: any) => Math.max(0, d.y1 - d.y0))
      .attr("fill", (d: any) => getColor((d.data as any).value))
      .attr("stroke", "rgba(0,0,0,0.2)")
      .attr("stroke-width", 1)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("opacity", 0.9);

    const labels = svg
      .selectAll(".label")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d: any) => (d.x0 + d.x1) / 2)
      .attr("y", (d: any) => (d.y0 + d.y1) / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "rgba(255,255,255,0.9)")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)")
      .style("pointer-events", "none")
      .text((d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        return width > 50 && height > 30 ? (d.data as any).name : "";
      });

    // Reuse existing tooltip or create new one
    let tooltip = tooltipRef.current;
    if (!tooltip) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "glass-panel vantage-treemap-tooltip")
        .style("position", "absolute")
        .style("padding", "8px 12px")
        .style("border-radius", "8px")
        .style("font-size", "13px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 100)
        .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)");
      tooltipRef.current = tooltip;
    }

    nodes.on("mouseover", function(event, d: any) {
      d3.select(this).transition().duration(200).attr("opacity", 1).attr("filter", "brightness(1.1)");
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <div class="font-medium text-white">${d.data.name}</div>
        <div class="text-xs text-muted-foreground">Size: <span class="text-white font-mono">${formatBytes(d.data.value)}</span></div>
      `);
      tooltip
        .style("left", (event.pageX + 15).toString() + "px")
        .style("top", (event.pageY - 28).toString() + "px");
    });

    nodes.on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15).toString() + "px")
        .style("top", (event.pageY - 28).toString() + "px");
    });

    nodes.on("mouseout", function() {
      d3.select(this).transition().duration(200).attr("opacity", 0.9).attr("filter", null);
      tooltip.transition().duration(200).style("opacity", 0);
    });

    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
    };
  }, [data]);

  function getColor(size: number): string {
    // Using tailwind colors: emerald-600, blue-600, amber-600, red-600
    if (size < 100 * 1024) return "#059669";
    if (size < 500 * 1024) return "#2563eb";
    if (size < 1024 * 1024) return "#d97706";
    return "#dc2626";
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4 tracking-tight">Bundle Composition</h2>
        <p className="text-muted mb-6">
          Interactive visualization of your bundle composition
        </p>

        <div className="border border-white/5 rounded-lg p-1 bg-black/20 overflow-hidden">
          <svg
            ref={svgRef}
            width={800}
            height={600}
            className="w-full h-auto rounded"
            style={{ shapeRendering: "geometricPrecision" }}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center">
            <div
              className="w-3 h-3 mr-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              style={{ backgroundColor: "#059669" }}
            />
            <span className="text-muted-foreground">&lt; 100KB</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-3 h-3 mr-2 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"
              style={{ backgroundColor: "#2563eb" }}
            />
            <span className="text-muted-foreground">100KB - 500KB</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-3 h-3 mr-2 rounded-full shadow-[0_0_8px_rgba(217,119,6,0.4)]"
              style={{ backgroundColor: "#d97706" }}
            />
            <span className="text-muted-foreground">500KB - 1MB</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-3 h-3 mr-2 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.4)]"
              style={{ backgroundColor: "#dc2626" }}
            />
            <span className="text-muted-foreground">&gt; 1MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
