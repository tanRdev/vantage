import Reporter from "../core/reporter.js";
import { NextjsParser } from "../analyzers/bundle/nextjs.js";
import { BundleAnalyzer } from "../analyzers/bundle/analyzer.js";
import type { BundleConfig } from "../core/config.js";

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
      return;
    }

    const chunks = parser.getChunks(nextjsInfo.outputDir);

    if (chunks.length === 0) {
      Reporter.warn("No build artifacts found. Run 'npm run build' first.");
      return;
    }

    Reporter.info(`Analyzing ${chunks.length} chunks...`);

    const analyzer = new BundleAnalyzer();
    const analysis = analyzer.analyzeChunks(chunks);

    Reporter.info(`Total Bundle Size: ${Reporter.formatBytes(analysis.totalSize)}`);
    Reporter.info(`Chunk Count: ${analysis.chunkCount}`);
    Reporter.info(`Total Modules: ${analysis.totalModules}`);
    Reporter.info(`Duplicate Modules: ${analysis.duplicateModules}`);
    Reporter.info(`Dead Code Modules: ${analysis.deadCodeModules}`);

    let hasFailures = false;

    if (this.config.budgets && this.config.budgets.length > 0) {
      Reporter.info("Budget Check:");

      const budgetResults = analyzer.checkBudget(chunks, this.config.budgets);

      for (const result of budgetResults) {
        const status = result.exceeds ? "FAIL" : "PASS";
        Reporter.info(`  ${status} ${result.path}: ${Reporter.formatBytes(result.currentSize)} / ${result.maxSize}`);
      }

      if (budgetResults.some(r => r.exceeds)) {
        Reporter.error("Bundle budget exceeded!");
        hasFailures = true;
      }
    }

    if (!hasFailures) {
      Reporter.success("All bundle checks passed!");
    } else {
      const error = new Error("Bundle budget exceeded") as Error & { code: number };
      error.code = 1;
      throw error;
    }
  }
}
