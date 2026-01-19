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

export interface LighthouseRawResult {
  lcp?: string;
  cls?: string;
  tbt?: string;
  fcp?: string;
  performanceScore?: string;
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
    const runResults: LighthouseRawResult[] = [];

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

  private runSingleLighthouse(url: string, runIndex: number): LighthouseRawResult {
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

    execSync(command, {
      cwd: process.cwd(),
      encoding: "utf-8",
      stdio: "pipe",
    });

    const result = this.parseLighthouseOutput(command);

    return result;
  }

  private calculateMedian(results: LighthouseRawResult[]): LighthouseResult {
    const scores = this.extractMetricValues(results, "performanceScore").map(Number).sort((a, b) => a - b);
    const lcps = this.extractMetricValues(results, "lcp").map(Number).sort((a, b) => a - b);
    const clsValues = this.extractMetricValues(results, "cls").map(Number).sort((a, b) => a - b);
    const tbts = this.extractMetricValues(results, "tbt").map(Number).sort((a, b) => a - b);
    const fcps = this.extractMetricValues(results, "fcp").map(Number).sort((a, b) => a - b);

    const medianIndex = Math.floor(results.length / 2);

    return {
      url: results[0].url,
      score: scores[medianIndex],
      lcp: lcps[medianIndex],
      cls: clsValues[medianIndex],
      tbt: tbts[medianIndex],
      fcp: fcps[medianIndex],
      inp: 0,
      runs: results.length,
    };
  }

  private parseLighthouseOutput(commandOutput: string): LighthouseRawResult {
    const lcpMatch = commandOutput.match(/Largest Contentful Paint:\s*(\d+\.?\d*)\s*ms/);
    const clsMatch = commandOutput.match(/Cumulative Layout Shift:\s*(\d+\.?\d*)/);
    const tbtMatch = commandOutput.match(/Total Blocking Time:\s*(\d+\.?\d*)\s*ms/);
    const fcpMatch = commandOutput.match(/First Contentful Paint:\s*(\d+\.?\d*)\s*ms/);
    const scoreMatch = commandOutput.match(/Performance score:\s*(\d+)/);

    return {
      url: "",
      lcp: lcpMatch ? lcpMatch[1] : undefined,
      cls: clsMatch ? clsMatch[1] : undefined,
      tbt: tbtMatch ? tbtMatch[1] : undefined,
      fcp: fcpMatch ? fcpMatch[1] : undefined,
      performanceScore: scoreMatch ? scoreMatch[1] : undefined,
    };
  }

  private extractMetricValues(results: LighthouseRawResult[], key: keyof LighthouseRawResult): string[] {
    const values: string[] = [];

    for (const result of results) {
      const value = result[key];
      if (value !== undefined) {
        values.push(value);
      }
    }

    return values;
  }

  private getThrottlingConfig(): string {
    const mapping: Record<string, string> = {
      "fast-3g": "devtools",
      "slow-4g": "devtools",
      "offline": "offline",
    };

    return mapping[this.options.throttling] || "devtools";
  }

  private getPresetConfig(): string {
    const mapping: Record<string, string> = {
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
