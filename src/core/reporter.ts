import logger from "../utils/logger.js";

export interface MetricComparison {
  name: string;
  current: number | string;
  previous: number | string;
  delta: number | string;
  status: "pass" | "warn" | "fail";
}

export interface BundleDiff {
  added: Array<{ name: string; size: number }>;
  removed: Array<{ name: string; size: number }>;
  modified: Array<{
    name: string;
    oldSize: number;
    newSize: number;
    delta: number;
  }>;
  totalSizeDelta: number;
}

export class Reporter {
  static printMetricTable(metrics: MetricComparison[]): void {
    console.log("\n📊 Performance Metrics\n");

    console.log(
      [
        "Metric",
        "Current",
        "Previous",
        "Delta",
        "Status",
      ].join(" | ")
    );

    console.log(
      [
        "-------",
        "-------",
        "-------",
        "-------",
        "-------",
      ].join(" | ")
    );

    for (const metric of metrics) {
      const status = metric.status === "pass" ? "✅" : metric.status === "warn" ? "⚠️" : "❌";
      console.log(
        [
          metric.name,
          this.formatValue(metric.current),
          this.formatValue(metric.previous),
          this.formatDelta(metric.delta),
          status,
        ].join(" | ")
      );
    }
    console.log();
  }

  static printBundleDiff(diff: BundleDiff): void {
    console.log("\n📦 Bundle Size Changes\n");

    if (diff.modified.length > 0) {
      console.log("\nModified Chunks:");
      for (const chunk of diff.modified) {
        const status = chunk.delta > 0 ? "📈" : "📉";
        console.log(
          `  ${status} ${chunk.name}: ${this.formatBytes(chunk.oldSize)} → ${this.formatBytes(chunk.newSize)} (${this.formatDelta(chunk.delta)})`
        );
      }
    }

    if (diff.added.length > 0) {
      console.log("\nNew Chunks:");
      for (const chunk of diff.added) {
        console.log(`  ➕ ${chunk.name}: ${this.formatBytes(chunk.size)}`);
      }
    }

    if (diff.removed.length > 0) {
      console.log("\nRemoved Chunks:");
      for (const chunk of diff.removed) {
        console.log(`  ➖ ${chunk.name}: ${this.formatBytes(chunk.size)}`);
      }
    }

    console.log(`\nTotal Change: ${this.formatDelta(diff.totalSizeDelta)}\n`);
  }

  static printPRComment(
    metrics: MetricComparison[],
    bundleDiff: BundleDiff,
    buildId: number,
    runUrl?: string
  ): string {
    let comment = `## Performance Results #${buildId}\n\n`;

    comment += `| Metric | Current | Previous | Delta | Status |\n`;
    comment += `|--------|---------|----------|-------|--------|\n`;

    for (const metric of metrics) {
      const status = metric.status === "pass" ? "✅" : metric.status === "warn" ? "⚠️" : "❌";
      comment += `| ${metric.name} | ${this.formatValue(metric.current)} | ${this.formatValue(metric.previous)} | ${this.formatDelta(metric.delta)} | ${status} |\n`;
    }

    if (bundleDiff.modified.length > 0 || bundleDiff.added.length > 0 || bundleDiff.removed.length > 0) {
      comment += `\n### Bundle Analysis\n`;

      for (const chunk of bundleDiff.modified) {
        const change = chunk.delta > 0 ? `+${this.formatBytes(chunk.delta)}` : this.formatBytes(chunk.delta);
        comment += `- **${chunk.name}**: ${this.formatBytes(chunk.oldSize)} → ${this.formatBytes(chunk.newSize)} (${change})\n`;
      }

      for (const chunk of bundleDiff.added) {
        comment += `- **${chunk.name}**: ${this.formatBytes(chunk.size)} (new)\n`;
      }
    }

    if (runUrl) {
      comment += `\n[View detailed report](${runUrl})`;
    }

    return comment;
  }

  static formatValue(value: number | string): string {
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return String(value);
  }

  static formatDelta(delta: number | string): string {
    if (typeof delta === "string") {
      return delta;
    }

    if (delta > 0) {
      return `+${delta.toFixed(2)}`;
    } else if (delta < 0) {
      return `${delta.toFixed(2)}`;
    }
    return "0.00";
  }

  static formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  static error(message: string, error?: Error): void {
    logger.error(message, { error: error?.message, stack: error?.stack });
    console.error(`\n❌ ${message}`);
    if (error) {
      console.error(`\n${error.message}\n`);
    }
  }

  static success(message: string): void {
    logger.info(message);
    console.log(`\n✅ ${message}`);
  }

  static warn(message: string): void {
    logger.warn(message);
    console.log(`\n⚠️  ${message}`);
  }

  static info(message: string): void {
    logger.info(message);
    console.log(`\nℹ️  ${message}`);
  }
}

export default Reporter;
