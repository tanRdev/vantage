import { spawn } from "child_process";
import type { LighthouseResult } from "../../types.js";

export { LighthouseResult };

export interface LighthouseRawResult {
  lcp?: string;
  inp?: string;
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
        const result = await this.runSingleLighthouse(url, i);
        runResults.push(result);
      } catch (error) {
        console.error(`    Run ${i + 1} failed:`, error instanceof Error ? error.message : String(error));
      }
    }

    if (runResults.length === 0) {
      throw new Error(`All Lighthouse runs failed for ${url}`);
    }

    return this.calculateMedian(runResults, url);
  }

  private async runSingleLighthouse(url: string, runIndex: number): Promise<LighthouseRawResult> {
    const throttling = this.getThrottlingConfig();
    const preset = this.getPresetConfig();

    const args = [
      "@lhci/cli",
      "autorun",
      `--collect.url=${url}`,
      `--collect.numberOfRuns=1`,
      `--collect.settings.preset=${preset}`,
      `--collect.settings.throttling=${throttling}`,
      `--collect.staticDistDir=.`,
      `--upload.target=temporary-public-storage`,
    ];

    const output = await this.spawnCommand("npx", args);
    return this.parseLighthouseOutput(output);
  }

  private spawnCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      const child = spawn(command, args, {
        cwd: process.cwd(),
        shell: true,
      });

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Failed to spawn command: ${error.message}`));
      });
    });
  }

  private calculateMedian(results: LighthouseRawResult[], url: string): LighthouseResult {
    const scores = this.extractMetricValues(results, "performanceScore").map(Number).sort((a, b) => a - b);
    const lcps = this.extractMetricValues(results, "lcp").map(Number).sort((a, b) => a - b);
    const inps = this.extractMetricValues(results, "inp").map(Number).sort((a, b) => a - b);
    const clsValues = this.extractMetricValues(results, "cls").map(Number).sort((a, b) => a - b);
    const tbts = this.extractMetricValues(results, "tbt").map(Number).sort((a, b) => a - b);
    const fcps = this.extractMetricValues(results, "fcp").map(Number).sort((a, b) => a - b);

    const medianIndex = Math.floor(results.length / 2);

    return {
      url,
      score: scores[medianIndex] || 0,
      lcp: lcps[medianIndex] || 0,
      inp: inps[medianIndex] || 0,
      cls: clsValues[medianIndex] || 0,
      tbt: tbts[medianIndex] || 0,
      fcp: fcps[medianIndex] || 0,
      runs: results.length,
    };
  }

  private parseLighthouseOutput(commandOutput: string): LighthouseRawResult {
    const lcpMatch = commandOutput.match(/Largest Contentful Paint:\s*(\d+\.?\d*)\s*ms/);
    const inpMatch = commandOutput.match(/Interaction to Next Paint:\s*(\d+\.?\d*)\s*ms/);
    const clsMatch = commandOutput.match(/Cumulative Layout Shift:\s*(\d+\.?\d*)/);
    const tbtMatch = commandOutput.match(/Total Blocking Time:\s*(\d+\.?\d*)\s*ms/);
    const fcpMatch = commandOutput.match(/First Contentful Paint:\s*(\d+\.?\d*)\s*ms/);
    const scoreMatch = commandOutput.match(/Performance score:\s*(\d+)/);

    return {
      lcp: lcpMatch ? lcpMatch[1] : undefined,
      inp: inpMatch ? inpMatch[1] : undefined,
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
