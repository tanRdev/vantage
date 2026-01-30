import type { RuntimeThresholds } from "./config.js";

export interface ThresholdResult {
  passed: boolean;
  delta: number;
  status: "pass" | "warn" | "fail";
  message?: string;
}

export class ThresholdEngine {
  static compareBundleSize(
    current: number,
    previous: number,
    regressionThreshold: number,
    warningThreshold: number
  ): ThresholdResult {
    const delta = current - previous;

    // When previous is 0, we cannot calculate percentage change.
    // This could indicate a bug in bundle analysis (no size detected).
    // Treat as a baseline but return info status.
    if (previous === 0) {
      return {
        passed: true,
        delta,
        status: "pass",
        message: "No previous bundle data for comparison (baseline measurement)",
      };
    }

    const percentChange = (delta / previous) * 100;

    if (percentChange <= warningThreshold) {
      return {
        passed: true,
        delta,
        status: "pass",
        message: undefined,
      };
    }

    if (percentChange <= regressionThreshold) {
      return {
        passed: true,
        delta,
        status: "warn",
        message: `Bundle size increased by ${percentChange.toFixed(1)}% (warning threshold: ${warningThreshold}%)`,
      };
    }

    return {
      passed: false,
      delta,
      status: "fail",
      message: `Bundle size increased by ${percentChange.toFixed(1)}% (exceeds regression threshold: ${regressionThreshold}%)`,
    };
  }

  static compareRuntimeMetric(
    current: number,
    threshold: RuntimeThresholds,
    metricName: keyof RuntimeThresholds
  ): ThresholdResult {
    const limit = threshold[metricName];
    if (!limit) {
      return {
        passed: true,
        delta: 0,
        status: "pass",
      };
    }

    if (current <= limit) {
      return {
        passed: true,
        delta: current - limit,
        status: "pass",
      };
    }

    const delta = current - limit;
    const percentOver = (delta / limit) * 100;

    return {
      passed: false,
      delta,
      status: "fail",
      message: `${metricName.toUpperCase()} is ${current.toFixed(0)}ms, exceeding threshold of ${limit}ms by ${percentOver.toFixed(1)}%`,
    };
  }

  static calculateScore(
    metrics: Array<ThresholdResult>
  ): number {
    const passed = metrics.filter(m => m.passed).length;
    const total = metrics.length;
    return Math.round((passed / total) * 100);
  }

  static shouldBlockPR(results: Array<ThresholdResult>): boolean {
    return results.some(r => r.status === "fail");
  }

  static shouldWarn(results: Array<ThresholdResult>): boolean {
    return results.some(r => r.status === "warn" || r.status === "fail");
  }
}

export default ThresholdEngine;
