// Size thresholds for color coding (in bytes)
const SIZE_THRESHOLD_SMALL = 100 * 1024;   // 100KB
const SIZE_THRESHOLD_MEDIUM = 500 * 1024;  // 500KB
const SIZE_THRESHOLD_LARGE = 1024 * 1024;  // 1MB

// Color constants
const COLOR_SMALL = "#4CAF50";
const COLOR_MEDIUM = "#2196F3";
const COLOR_LARGE = "#FF9800";
const COLOR_XLARGE = "#F44336";

function getColor(size) {
  if (size < SIZE_THRESHOLD_SMALL) return COLOR_SMALL;
  if (size < SIZE_THRESHOLD_MEDIUM) return COLOR_MEDIUM;
  if (size < SIZE_THRESHOLD_LARGE) return COLOR_LARGE;
  return COLOR_XLARGE;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function createTreemap(data) {
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
      .style("opacity", 1);

    const content = `
      <strong>${d.data.name}</strong><br/>
      Size: ${formatBytes(d.value)}
    `;

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

  return { container, tooltip, width, height };
}

function updateTreemap(data, container, tooltip) {
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
      .style("opacity", 1);

    const content = `
      <strong>${d.data.name}</strong><br/>
      Size: ${formatBytes(d.value)}
    `;

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

  return newContainer;
}

// Initialize when data is available
window.addEventListener("load", () => {
  if (window.treemapData) {
    const { container, tooltip } = createTreemap(window.treemapData);

    window.addEventListener("resize", () => {
      d3.select(".tooltip").remove();
      updateTreemap(window.treemapData);
    });
  }
});
