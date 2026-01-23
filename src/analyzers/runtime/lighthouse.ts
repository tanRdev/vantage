import { spawn } from "child_process";
import Reporter from "../../core/reporter.js";

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
      Reporter.info(`Running Lighthouse on ${url}...`);

      try {
        const result = await this.runLighthouse(url);
        results.push(result);
      } catch (error) {
        Reporter.error(
          `Lighthouse failed for ${url}`,
          error instanceof Error ? error : new Error(String(error)),
        );
        throw error;
      }
    }

    return results;
  }

  private async runLighthouse(url: string): Promise<LighthouseResult> {
    const runResults: LighthouseRawResult[] = [];

    for (let i = 0; i < this.options.numberOfRuns; i++) {
      Reporter.info(`  Run ${i + 1}/${this.options.numberOfRuns}...`);

      try {
        const result = await this.runSingleLighthouse(url, i);
        runResults.push(result);
      } catch (error) {
        Reporter.error(
          `    Run ${i + 1} failed`,
          error instanceof Error ? error : new Error(String(error)),
        );
        if (runResults.length === 0) {
          throw error;
        }
      }
    }

    if (runResults.length === 0) {
      throw new Error(`All Lighthouse runs failed for ${url}`);
    }

    return this.calculateMedian(runResults, url);
  }

  private async runSingleLighthouse(
    url: string,
    _runIndex: number,
  ): Promise<LighthouseRawResult> {
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
      `--output=json`,
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
        timeout: 120000,
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
          reject(
            new Error(`Command failed with code ${code}: ${stderr || stdout}`),
          );
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Failed to spawn command: ${error.message}`));
      });

      child.on("timeout", () => {
        child.kill();
        reject(new Error(`Command timed out after 120000ms`));
      });
    });
  }

  private calculateMedian(
    results: LighthouseRawResult[],
    url: string,
  ): LighthouseResult {
    const scores = this.extractMetricValues(results, "performanceScore")
      .map(Number)
      .sort((a, b) => a - b);
    const lcps = this.extractMetricValues(results, "lcp")
      .map(Number)
      .sort((a, b) => a - b);
    const inps = this.extractMetricValues(results, "inp")
      .map(Number)
      .sort((a, b) => a - b);
    const clsValues = this.extractMetricValues(results, "cls")
      .map(Number)
      .sort((a, b) => a - b);
    const tbts = this.extractMetricValues(results, "tbt")
      .map(Number)
      .sort((a, b) => a - b);
    const fcps = this.extractMetricValues(results, "fcp")
      .map(Number)
      .sort((a, b) => a - b);

    const medianIndex = Math.floor(results.length / 2);

    // Helper to get optional metric (returns undefined if no values)
    const getOptionalMetric = (values: number[]): number | undefined => {
      return values.length > 0 ? values[medianIndex] : undefined;
    };

    return {
      url,
      score: scores[medianIndex] || 0,
      lcp: lcps[medianIndex] || 0,
      inp: getOptionalMetric(inps),
      cls: clsValues[medianIndex] || 0,
      tbt: tbts[medianIndex] || 0,
      fcp: fcps[medianIndex] || 0,
      runs: results.length,
    };
  }

  private parseLighthouseOutput(commandOutput: string): LighthouseRawResult {
    return this.parseLighthouseJsonOutput(commandOutput);
  }

  private parseLighthouseJsonOutput(jsonOutput: string): LighthouseRawResult {
    if (!jsonOutput || jsonOutput.trim() === "") {
      return {};
    }

    try {
      const parsed = JSON.parse(jsonOutput);
      const result: LighthouseRawResult = {};

      if (parsed.audits) {
        if (
          parsed.audits["largest-contentful-paint"]?.numericValue !== undefined
        ) {
          result.lcp = String(
            parsed.audits["largest-contentful-paint"].numericValue,
          );
        }
        if (
          parsed.audits["interaction-to-next-paint"]?.numericValue !== undefined
        ) {
          result.inp = String(
            parsed.audits["interaction-to-next-paint"].numericValue,
          );
        }
        if (
          parsed.audits["cumulative-layout-shift"]?.numericValue !== undefined
        ) {
          result.cls = String(
            parsed.audits["cumulative-layout-shift"].numericValue,
          );
        }
        if (parsed.audits["total-blocking-time"]?.numericValue !== undefined) {
          result.tbt = String(
            parsed.audits["total-blocking-time"].numericValue,
          );
        }
        if (
          parsed.audits["first-contentful-paint"]?.numericValue !== undefined
        ) {
          result.fcp = String(
            parsed.audits["first-contentful-paint"].numericValue,
          );
        }
      }

      if (parsed.categories?.performance?.score !== undefined) {
        const score = parsed.categories.performance.score;
        result.performanceScore =
          score >= 1
            ? String(Math.round(score))
            : String(Math.round(score * 100));
      }

      return result;
    } catch {
      return {};
    }
  }

  private extractMetricValues(
    results: LighthouseRawResult[],
    key: keyof LighthouseRawResult,
  ): string[] {
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
      offline: "offline",
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
