import { execSync } from "child_process";

export interface LighthouseResult {
  url: string;
  score: number;
  lcp: number;
  inp?: number;
  cls: number;
  tbt: number;
  fcp: number;
  runs: number;
}

export interface LighthouseOptions {
  urls: string[];
  numberOfRuns: number;
  preset: "desktop" | "mobile";
  throttling: "fast-3g" | "slow-4g" | "offline";
  outputDir: string;
}

export class LighthouseRunner {
  private options: LighthouseOptions;

  constructor(options: LighthouseOptions) {
    this.options = options;
  }

  async run(): Promise<LighthouseResult[]> {
    const results: LighthouseResult[] = [];

    for (const url of this.options.urls) {
      console.log(`\n🔍 Running Lighthouse on ${url}...`);
      const result = await this.runLighthouse(url);
      results.push(result);
    }

    return results;
  }

  private async runLighthouse(url: string): Promise<LighthouseResult> {
    const runResults = [];

    for (let i = 0; i < this.options.numberOfRuns; i++) {
      console.log(`  Run ${i + 1}/${this.options.numberOfRuns}...`);

      try {
        const result = this.runSingleLighthouse(url, i);
        runResults.push(result);
      } catch (error) {
        console.error(`    Run ${i + 1} failed:`, error);
      }
    }

    if (runResults.length === 0) {
      throw new Error(`All Lighthouse runs failed for ${url}`);
    }

    return this.calculateMedian(runResults);
  }

  private runSingleLighthouse(url: string, runIndex: number): any {
    const outputFile = this.getOutputPath(url, runIndex);
    const throttling = this.getThrottlingConfig();
    const preset = this.getPresetConfig();

    const command = [
      "npx",
      "@lhci/cli",
      "autorun",
      `--collect.url=${url}`,
      `--collect.numberOfRuns=1`,
      `--collect.settings.preset=${preset}`,
      `--collect.settings.throttling=${throttling}`,
      `--collect.staticDistDir=.`,
      `--upload.target=temporary-public-storage`,
    ].join(" ");

    const output = execSync(command, {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const result = this.parseLighthouseOutput(output);

    return {
      url,
      ...result,
    };
  }

  private calculateMedian(results: any[]): LighthouseResult {
    const scores = results.map(r => r.score).sort((a, b) => a - b);
    const lcps = results.map(r => r.lcp).sort((a, b) => a - b);
    const clsValues = results.map(r => r.cls).sort((a, b) => a - b);
    const tbts = results.map(r => r.tbt).sort((a, b) => a - b);
    const fcps = results.map(r => r.fcp).sort((a, b) => a - b);

    const medianIndex = Math.floor(results.length / 2);

    return {
      url: results[0].url,
      score: scores[medianIndex],
      lcp: lcps[medianIndex],
      cls: clsValues[medianIndex],
      tbt: tbts[medianIndex],
      fcp: fcps[medianIndex],
      inp: results[0].inp,
      runs: results.length,
    };
  }

  private parseLighthouseOutput(output: string): any {
    const lcpMatch = output.match(/Largest Contentful Paint:\s*(\d+\.?\d*)\s*ms/);
    const clsMatch = output.match(/Cumulative Layout Shift:\s*(\d+\.?\d*)/);
    const tbtMatch = output.match(/Total Blocking Time:\s*(\d+\.?\d*)\s*ms/);
    const fcpMatch = output.match(/First Contentful Paint:\s*(\d+\.?\d*)\s*ms/);
    const scoreMatch = output.match(/Performance score:\s*(\d+)/);

    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) / 100 : 0,
      lcp: lcpMatch ? parseFloat(lcpMatch[1]) : 0,
      cls: clsMatch ? parseFloat(clsMatch[1]) : 0,
      tbt: tbtMatch ? parseFloat(tbtMatch[1]) : 0,
      fcp: fcpMatch ? parseFloat(fcpMatch[1]) : 0,
      inp: 0,
    };
  }

  private getThrottlingConfig(): string {
    const mapping = {
      "fast-3g": "devtools",
      "slow-4g": "devtools",
      "offline": "offline",
    };

    return mapping[this.options.throttling] || "devtools";
  }

  private getPresetConfig(): string {
    const mapping = {
      desktop: "desktop",
      mobile: "mobile",
    };

    return mapping[this.options.preset] || "desktop";
  }

  private getOutputPath(url: string, runIndex: number): string {
    const sanitizedUrl = url.replace(/[^a-zA-Z0-9]/g, "_");
    return `${sanitizedUrl}_run${runIndex}.json`;
  }
}
