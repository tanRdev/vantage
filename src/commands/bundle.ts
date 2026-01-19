import { Command } from "@oclif/core";
import * as path from "path";
import Reporter from "../core/reporter.js";
import { NextjsParser } from "../analyzers/bundle/nextjs.js";
import { BundleAnalyzer } from "../analyzers/bundle/analyzer.js";
import { TreemapGenerator } from "../analyzers/bundle/treemap.js";

export default class Bundle extends Command {
  static description = "Analyze bundle size and composition";
  static id = "bundle";

  async run(): Promise<void> {
    console.log("📦 Bundle Analysis\n");

    try {
      const { loadConfig } = await import("../core/config.js");
      const config = await loadConfig();

      Reporter.info(`Framework: ${config.framework}`);
      Reporter.info(`Analysis mode: ${config.bundle.analysis}`);

      const parser = new NextjsParser(process.cwd());
      const nextjsInfo = parser.detectNextjs();

      if (!nextjsInfo) {
        Reporter.error("Could not detect Next.js project. Make sure you're in a Next.js project root.");
        process.exit(1);
      }

      console.log(`\n🔍 Next.js Version: ${nextjsInfo.version}`);
      console.log(`📁 Router Type: ${nextjsInfo.routerType}`);
      console.log(`📦 Output Directory: ${nextjsInfo.outputDir}`);
      console.log(`⚡ Turbopack: ${nextjsInfo.hasTurbopack ? "Yes" : "No"}\n`);

      const chunks = parser.getChunks(nextjsInfo.outputDir);

      if (chunks.length === 0) {
        Reporter.warn("No build artifacts found. Run 'npm run build' first.");
        process.exit(0);
      }

      console.log(`\n📊 Analyzing ${chunks.length} chunks...\n`);

      const analyzer = new BundleAnalyzer();
      const analysis = analyzer.analyzeChunks(chunks);

      console.log(`Total Bundle Size: ${Reporter.formatBytes(analysis.totalSize)}`);
      console.log(`Chunk Count: ${analysis.chunkCount}`);
      console.log(`Total Modules: ${analysis.totalModules}`);
      console.log(`Duplicate Modules: ${analysis.duplicateModules}`);
      console.log(`Dead Code Modules: ${analysis.deadCodeModules}`);

      console.log("\n📦 Top 10 Largest Modules:\n");
      for (let i = 0; i < Math.min(analysis.largestModules.length, 10); i++) {
        const module = analysis.largestModules[i];
        console.log(`  ${i + 1}. ${module.name}: ${Reporter.formatBytes(module.size)}`);
      }

      if (config.bundle.budgets && config.bundle.budgets.length > 0) {
        console.log("\n🎯 Budget Check:\n");

        const budgetResults = analyzer.checkBudget(chunks, config.bundle.budgets);

        for (const result of budgetResults) {
          const status = result.exceeds ? "❌" : "✅";
          console.log(`  ${status} ${result.path}: ${Reporter.formatBytes(result.currentSize)} / ${result.maxSize}`);
        }
      }

      if (analysis.totalModules > 0) {
        console.log("\n💡 Optimization Recommendations:\n");

        if (analysis.duplicateModules > 0) {
          console.log(`  - ${analysis.duplicateModules} duplicate modules found. Consider deduplication.`);
        }

        if (analysis.deadCodeModules > 0) {
          console.log(`  - ${analysis.deadCodeModules} dead code modules found. Review and remove unused imports.`);
        }

        if (analysis.totalSize > 500 * 1024) {
          console.log(`  - Bundle size exceeds 500KB. Consider code splitting and lazy loading.`);
        }
      }

      if (config.bundle.treemap) {
        console.log("\n🌳 Generating treemap visualization...\n");

        const treemapGenerator = new TreemapGenerator();
        const treemapData = analyzer.generateTreemapData(chunks);

        const outputDir = path.join(process.cwd(), ".performance-enforcer");
        const treemapPath = path.join(outputDir, "treemap.html");

        treemapGenerator.generateHTML(treemapData, treemapPath);

        console.log(`✅ Treemap generated: ${treemapPath}`);
        console.log(`💡 Open in browser: file://${treemapPath}\n`);
      }

      process.exit(0);

    } catch (error) {
      Reporter.error("Bundle analysis failed", error as Error);
      process.exit(1);
    }
  }
}
