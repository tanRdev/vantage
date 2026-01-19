import Reporter from "../core/reporter.js";
import { NextjsParser } from "../analyzers/bundle/nextjs.js";
import { BundleAnalyzer } from "../analyzers/bundle/analyzer.js";
import type { BundleConfig } from "../types.js";

export class BundleChecker {
  constructor(
    private workingDir: string,
    private config: BundleConfig
  ) {}

  check(): void {
    const parser = new NextjsParser(this.workingDir);
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

    if (this.config.budgets && this.config.budgets.length > 0) {
      console.log("\n🎯 Budget Check:\n");

      const budgetResults = analyzer.checkBudget(chunks, this.config.budgets);

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
  }
}
