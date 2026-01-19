"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
}

export function Treemap() {
  const svgRef = useRef<SVGSVGElement>(null);

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
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);

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
      .attr("fill", "#fff")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
      .style("pointer-events", "none")
      .text((d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        return width > 50 && height > 30 ? (d.data as any).name : "";
      });

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "12px")
      .style("border-radius", "4px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    nodes.on("mouseover", function(event, d: any) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <strong>${d.data.name}</strong><br/>
        Size: ${formatBytes(d.data.value)}
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
      tooltip.transition().duration(200).style("opacity", 0);
    });

    return () => {
      tooltip.remove();
    };
  }, [data]);

  function getColor(size: number): string {
    if (size < 100 * 1024) return "#4CAF50";
    if (size < 500 * 1024) return "#2196F3";
    if (size < 1024 * 1024) return "#FF9800";
    return "#F44336";
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Bundle Treemap</h2>
        <p className="text-gray-600 mb-6">
          Interactive visualization of your bundle composition
        </p>

        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <svg
            ref={svgRef}
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>

        <div className="mt-6 flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div
              className="w-4 h-4 mr-2 rounded"
              style={{ backgroundColor: "#4CAF50" }}
            />
            <span>&lt; 100KB</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-4 h-4 mr-2 rounded"
              style={{ backgroundColor: "#2196F3" }}
            />
            <span>100KB - 500KB</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-4 h-4 mr-2 rounded"
              style={{ backgroundColor: "#FF9800" }}
            />
            <span>500KB - 1MB</span>
          </div>
          <div className="flex items-center">
            <div
              className="w-4 h-4 mr-2 rounded"
              style={{ backgroundColor: "#F44336" }}
            />
            <span>&gt; 1MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
