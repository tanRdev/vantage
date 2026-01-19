import { Command } from "@oclif/core";
import Reporter from "../core/reporter.js";
import { NextjsParser } from "../analyzers/bundle/nextjs.js";
import { BundleAnalyzer } from "../analyzers/bundle/analyzer.js";
import { RouteDetector } from "../analyzers/runtime/routes.js";
import { LighthouseRunner } from "../analyzers/runtime/lighthouse.js";
import { ThresholdEngine } from "../core/threshold.js";

export default class Check extends Command {
  static description = "Run all configured performance checks";
  static id = "check";

  async run(): Promise<void> {
    console.log("Running performance-enforcer checks...");
    console.log("\n🔍 Loading configuration...");

    try {
      const { loadConfig } = await import("../core/config.js");
      const config = await loadConfig();

      console.log("✅ Configuration loaded");
      console.log(`\nFramework: ${config.framework}`);

      const results = [];

      if (config.runtime) {
        console.log(`\n📊 Running runtime metrics...`);

        const nextjsInfo = new NextjsParser(process.cwd()).detectNextjs();

        if (!nextjsInfo) {
          Reporter.warn("Could not detect Next.js project. Skipping runtime checks.");
        } else {
          console.log(`\n🔍 Detecting routes...`);

          const routeDetector = new RouteDetector(process.cwd(), nextjsInfo.routerType);
          const allRoutes = routeDetector.detectRoutes(config.runtime.exclude || []);

          const routesToTest = routeDetector.getTopNRoutes(
            allRoutes,
            config.runtime.routes.length,
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
            numberOfRuns: config.runtime.lighthouse?.numberOfRuns || 3,
            preset: config.runtime.lighthouse?.preset || "desktop",
            throttling: config.runtime.lighthouse?.throttling || "fast-3g",
            outputDir: ".performance-enforcer/lighthouse",
          });

          const lighthouseResults = await lighthouseRunner.run();

          for (const result of lighthouseResults) {
            if (config.runtime.thresholds.lcp) {
              const lcpResult = ThresholdEngine.compareRuntimeMetric(
                result.lcp,
                config.runtime.thresholds,
                "lcp"
              );

              results.push({
                name: `LCP (${result.url.split("/").pop() || "/"})`,
                current: `${result.lcp.toFixed(0)}ms`,
                previous: "-",
                delta: "-",
                status: lcpResult.status as any,
              });
            }

            if (config.runtime.thresholds.inp && result.inp !== undefined) {
              const inpResult = ThresholdEngine.compareRuntimeMetric(
                result.inp,
                config.runtime.thresholds,
                "inp"
              );

              results.push({
                name: `INP (${result.url.split("/").pop() || "/"})`,
                current: `${result.inp.toFixed(0)}ms`,
                previous: "-",
                delta: "-",
                status: inpResult.status as any,
              });
            }

            if (config.runtime.thresholds.cls) {
              const clsResult = ThresholdEngine.compareRuntimeMetric(
                result.cls,
                config.runtime.thresholds,
                "cls"
              );

              results.push({
                name: `CLS (${result.url.split("/").pop() || "/"})`,
                current: result.cls.toFixed(3),
                previous: "-",
                delta: "-",
                status: clsResult.status as any,
              });
            }

            if (config.runtime.thresholds.tbt) {
              const tbtResult = ThresholdEngine.compareRuntimeMetric(
                result.tbt,
                config.runtime.thresholds,
                "tbt"
              );

              results.push({
                name: `TBT (${result.url.split("/").pop() || "/"})`,
                current: `${result.tbt.toFixed(0)}ms`,
                previous: "-",
                delta: "-",
                status: tbtResult.status as any,
              });
            }

            const score = result.score * 100;

            results.push({
              name: `Score (${result.url.split("/").pop() || "/"})`,
              current: `${score}`,
              previous: "-",
              delta: "-",
              status: score >= 90 ? ("pass" as any) : ("fail" as any),
            });
          }

          Reporter.printMetricTable(results);

          const shouldBlock = ThresholdEngine.shouldBlockPR(
            results.map(r => ({ passed: r.status === "pass", delta: 0, status: r.status as any }))
          );

          if (shouldBlock) {
            Reporter.error("Performance thresholds exceeded!");
            process.exit(1);
          }

          Reporter.success("All runtime checks passed!");
        }
      }

      console.log("\n📦 Running bundle analysis...");

      const parser = new NextjsParser(process.cwd());
      const nextjsInfo = parser.detectNextjs();

      if (!nextjsInfo) {
        Reporter.warn("No Next.js project detected. Skipping bundle analysis.");
        process.exit(0);
      }

      const chunks = parser.getChunks(nextjsInfo.outputDir);

      if (chunks.length === 0) {
        Reporter.warn("No build artifacts found. Run 'npm run build' first.");
        process.exit(0);
      }

      console.log(`\n📊 Analyzing ${chunks.length} chunks...`);

      const analyzer = new BundleAnalyzer();
      const analysis = analyzer.analyzeChunks(chunks);

      console.log(`\nTotal Bundle Size: ${Reporter.formatBytes(analysis.totalSize)}`);
      console.log(`Chunk Count: ${analysis.chunkCount}`);
      console.log(`Total Modules: ${analysis.totalModules}`);
      console.log(`Duplicate Modules: ${analysis.duplicateModules}`);
      console.log(`Dead Code Modules: ${analysis.deadCodeModules}`);

      if (config.bundle.budgets && config.bundle.budgets.length > 0) {
        console.log("\n🎯 Budget Check:\n");

        const budgetResults = analyzer.checkBudget(chunks, config.bundle.budgets);

        for (const result of budgetResults) {
          const status = result.exceeds ? "❌" : "✅";
          console.log(`  ${status} ${result.path}: ${Reporter.formatBytes(result.currentSize)} / ${result.maxSize}`);
        }

        if (budgetResults.some(r => r.exceeds)) {
          Reporter.error("Bundle budget exceeded!");
          process.exit(1);
        }
      }

      Reporter.success("All bundle checks passed!");

    } catch (error) {
      Reporter.error("Failed to run checks", error as Error);
      process.exit(1);
    }
  }
}
