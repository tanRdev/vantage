import * as fs from "fs";
import * as path from "path";

export interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  type?: "bundle" | "chunk" | "module" | "file";
  path?: string;
  sizeFormatted?: string;
  percentChange?: number;
}

export class TreemapGenerator {
  generateHTML(data: TreemapNode, outputPath: string): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bundle Treemap - Performance Enforcer</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    #treemap {
      width: 100%;
      height: 100vh;
    }
    .node {
      border:1px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: opacity 0.2s;
      overflow: hidden;
    }
    .node:hover {
      opacity: 0.8;
    }
    .label {
      font-size: 12px;
      font-weight: 500;
      color: white;
      text-shadow: 0 1px 3px rgba(0,0,0,0.6);
      padding: 8px;
      text-align: center;
      word-break: break-word;
      max-width: 100%;
    }
    .tooltip {
      position: absolute;
      background: #333;
      color: white;
      padding: 12px;
      border-radius: 4px;
      font-size: 13px;
      pointer-events: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
    }
    .legend {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .legend h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #333;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
    }
    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <div class="legend">
    <h3>Legend</h3>
    <div class="legend-item">
      <div class="legend-color" style="background: #4CAF50;"></div>
      <span>< 100KB</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #2196F3;"></div>
      <span>100KB - 500KB</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #FF9800;"></div>
      <span>500KB - 1MB</span>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background: #F44336;"></div>
      <span>> 1MB</span>
    </div>
  </div>
  <div id="treemap"></div>
  <script>
    const data = ${JSON.stringify(data)};

    const width = window.innerWidth - 40;
    const height = window.innerHeight - 40;

    const treemap = d3.treemap()
      .tile(d3.treemapSquarify)
      .size([width, height])
      .round(true)
      .paddingInner(2)
      .paddingOuter(3);

    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    treemap(root);

    const container = d3.select("#treemap")
      .append("div")
      .attr("width", width)
      .attr("height", height)
      .style("position", "relative");

    const nodes = container.selectAll(".node")
      .data(root.leaves())
      .enter()
      .append("div")
      .attr("class", "node")
      .style("position", "absolute")
      .style("left", d => d.x0 + "px")
      .style("top", d => d.y0 + "px")
      .style("width", d => d.x1 - d.x0 + "px")
      .style("height", d => d.y1 - d.y0 + "px")
      .style("background", d => getColor(d.value));

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    nodes.append("div")
      .attr("class", "label")
      .text(d => d.data.name)
      .style("display", d => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        return w > 50 && h > 30 ? "block" : "none";
      });

    nodes.on("mouseover", function(event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity",1);

      const content = \`
        <strong>\${d.data.name}</strong><br/>
        Size: \${formatBytes(d.value)}
      \`;

      tooltip.html(content)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0);
    });

    function getColor(size) {
      if (size < 100 * 1024) return "#4CAF50";
      if (size < 500 * 1024) return "#2196F3";
      if (size < 1024 * 1024) return "#FF9800";
      return "#F44336";
    }

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    window.addEventListener("resize", () => {
      container.remove();
      d3.select(".tooltip").remove();
      const newWidth = window.innerWidth - 40;
      const newHeight = window.innerHeight - 40;

      const newTreemap = d3.treemap()
        .tile(d3.treemapSquarify)
        .size([newWidth, newHeight])
        .round(true)
        .paddingInner(2)
        .paddingOuter(3);

      const newRoot = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

      newTreemap(newRoot);

      const newContainer = d3.select("#treemap")
        .append("div")
        .attr("width", newWidth)
        .attr("height", newHeight)
        .style("position", "relative");

      const newNodes = newContainer.selectAll(".node")
        .data(newRoot.leaves())
        .enter()
        .append("div")
        .attr("class", "node")
        .style("position", "absolute")
        .style("left", d => d.x0 + "px")
        .style("top", d => d.y0 + "px")
        .style("width", d => d.x1 - d.x0 + "px")
        .style("height", d => d.y1 - d.y0 + "px")
        .style("background", d => getColor(d.value));

      const newTooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      newNodes.append("div")
        .attr("class", "label")
        .text(d => d.data.name)
        .style("display", d => {
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          return w > 50 && h > 30 ? "block" : "none";
        });

      newNodes.on("mouseover", function(event, d) {
        newTooltip.transition()
          .duration(200)
          .style("opacity",1);

        const content = \`
          <strong>\${d.data.name}</strong><br/>
          Size: \${formatBytes(d.value)}
        \`;

        newTooltip.html(content)
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event) {
        newTooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        newTooltip.transition()
          .duration(200)
          .style("opacity", 0);
      });
    });
    </script>
</body>
</html>`;

    try {
      fs.writeFileSync(outputPath, html, "utf-8");
    } catch (error) {
      console.error(`Failed to write treemap HTML to ${outputPath}:`, error);
      throw error;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
