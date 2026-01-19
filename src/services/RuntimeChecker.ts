import Reporter from "../core/reporter.js";
import { RouteDetector } from "../analyzers/runtime/routes.js";
import { LighthouseRunner } from "../analyzers/runtime/lighthouse.js";
import { ThresholdEngine } from "../core/threshold.js";
import type { RuntimeConfig, LighthouseResult } from "../types.js";
import type { NextjsInfo } from "../analyzers/bundle/nextjs.js";
import { PERFORMANCE_SCORE_PASS_THRESHOLD } from "../core/constants.js";

interface MetricResult {
  name: string;
  current: string;
  previous: string;
  delta: string;
  status: "pass" | "warn" | "fail";
}

export class RuntimeChecker {
  constructor(
    private workingDir: string,
    private nextjsInfo: NextjsInfo,
    private config: RuntimeConfig
  ) {}

  async check(): Promise<void> {
    console.log(`\n🔍 Detecting routes...`);

    const routeDetector = new RouteDetector(this.workingDir, this.nextjsInfo.routerType);
    const allRoutes = routeDetector.detectRoutes(this.config.exclude || []);

    const routesToTest = routeDetector.getTopNRoutes(
      allRoutes,
      this.config.routes.length,
      ["api", "middleware"]
    );

    console.log(`\n📋 Found ${allRoutes.length} routes`);
    console.log(`\n🎯 Testing ${routesToTest.length} routes:\n`);

    for (const route of routesToTest) {
      console.log(`  - ${route.path}`);
    }

    console.log(`\n🚀 Running Lighthouse...`);

    const lighthouseRunner = new LighthouseRunner({
      urls: routesToTest.map(r => `http://localhost:3000${r.path}`),
      numberOfRuns: this.config.lighthouse?.numberOfRuns || 3,
      preset: this.config.lighthouse?.preset || "desktop",
      throttling: this.config.lighthouse?.throttling || "fast-3g",
      outputDir: ".performance-enforcer/lighthouse",
    });

    const lighthouseResults = await lighthouseRunner.run();

    const results = this.processResults(lighthouseResults);

    Reporter.printMetricTable(results);

    const shouldBlock = ThresholdEngine.shouldBlockPR(
      results.map(r => ({ passed: r.status === "pass", delta: 0, status: r.status }))
    );

    if (shouldBlock) {
      Reporter.error("Performance thresholds exceeded!");
      process.exit(1);
    }

    Reporter.success("All runtime checks passed!");
  }

  private processResults(lighthouseResults: LighthouseResult[]): MetricResult[] {
    const results: MetricResult[] = [];

    for (const result of lighthouseResults) {
      const routeName = result.url.split("/").pop() || "/";

      if (this.config.thresholds.lcp) {
        const lcpResult = ThresholdEngine.compareRuntimeMetric(
          result.lcp,
          this.config.thresholds,
          "lcp"
        );

        results.push({
          name: `LCP (${routeName})`,
          current: `${result.lcp.toFixed(0)}ms`,
          previous: "-",
          delta: "-",
          status: lcpResult.status,
        });
      }

      if (this.config.thresholds.inp && result.inp !== undefined) {
        const inpResult = ThresholdEngine.compareRuntimeMetric(
          result.inp,
          this.config.thresholds,
          "inp"
        );

        results.push({
          name: `INP (${routeName})`,
          current: `${result.inp.toFixed(0)}ms`,
          previous: "-",
          delta: "-",
          status: inpResult.status,
        });
      }

      if (this.config.thresholds.cls) {
        const clsResult = ThresholdEngine.compareRuntimeMetric(
          result.cls,
          this.config.thresholds,
          "cls"
        );

        results.push({
          name: `CLS (${routeName})`,
          current: result.cls.toFixed(3),
          previous: "-",
          delta: "-",
          status: clsResult.status,
        });
      }

      if (this.config.thresholds.tbt) {
        const tbtResult = ThresholdEngine.compareRuntimeMetric(
          result.tbt,
          this.config.thresholds,
          "tbt"
        );

        results.push({
          name: `TBT (${routeName})`,
          current: `${result.tbt.toFixed(0)}ms`,
          previous: "-",
          delta: "-",
          status: tbtResult.status,
        });
      }

      const score = result.score * 100;

      results.push({
        name: `Score (${routeName})`,
        current: `${score}`,
        previous: "-",
        delta: "-",
        status: score >= PERFORMANCE_SCORE_PASS_THRESHOLD ? "pass" : "fail",
      });
    }

    return results;
  }
}
