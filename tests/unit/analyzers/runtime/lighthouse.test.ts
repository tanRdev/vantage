import { describe, it, expect } from "vitest";
import {
  LighthouseRunner,
  type LighthouseRawResult,
} from "../../../../src/analyzers/runtime/lighthouse";

describe("LighthouseRunner", () => {
  describe("calculateMedian", () => {
    it("should return undefined for INP when no INP values are present", () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const resultsWithoutINP: LighthouseRawResult[] = [
        {
          lcp: "1200",
          inp: undefined,
          cls: "0.05",
          tbt: "100",
          fcp: "800",
          performanceScore: "95",
        },
        {
          lcp: "1300",
          inp: undefined,
          cls: "0.06",
          tbt: "110",
          fcp: "850",
          performanceScore: "94",
        },
        {
          lcp: "1250",
          inp: undefined,
          cls: "0.04",
          tbt: "105",
          fcp: "820",
          performanceScore: "96",
        },
      ];

      const result = (runner as any).calculateMedian(
        resultsWithoutINP,
        "http://localhost:3000",
      );

      expect(result.inp).toBeUndefined();
      expect(result.lcp).toBe(1250);
      expect(result.cls).toBe(0.05);
    });

    it("should return median INP when INP values are present", () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const resultsWithINP: LighthouseRawResult[] = [
        {
          lcp: "1200",
          inp: "150",
          cls: "0.05",
          tbt: "100",
          fcp: "800",
          performanceScore: "95",
        },
        {
          lcp: "1300",
          inp: "200",
          cls: "0.06",
          tbt: "110",
          fcp: "850",
          performanceScore: "94",
        },
        {
          lcp: "1250",
          inp: "180",
          cls: "0.04",
          tbt: "105",
          fcp: "820",
          performanceScore: "96",
        },
      ];

      const result = (runner as any).calculateMedian(
        resultsWithINP,
        "http://localhost:3000",
      );

      expect(result.inp).toBe(180);
    });

    it("should handle mixed INP presence (some runs with INP, some without)", () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const mixedResults: LighthouseRawResult[] = [
        {
          lcp: "1200",
          inp: "150",
          cls: "0.05",
          tbt: "100",
          fcp: "800",
          performanceScore: "95",
        },
        {
          lcp: "1300",
          inp: undefined,
          cls: "0.06",
          tbt: "110",
          fcp: "850",
          performanceScore: "94",
        },
        {
          lcp: "1250",
          inp: "180",
          cls: "0.04",
          tbt: "105",
          fcp: "820",
          performanceScore: "96",
        },
      ];

      const result = (runner as any).calculateMedian(
        mixedResults,
        "http://localhost:3000",
      );

      expect(result.inp).toBe(180);
    });

    it("should handle empty results array", () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const emptyResults: LighthouseRawResult[] = [];

      const result = (runner as any).calculateMedian(
        emptyResults,
        "http://localhost:3000",
      );

      expect(result.score).toBe(0);
      expect(result.inp).toBeUndefined();
    });
  });

  describe("extractMetricValues", () => {
    it("should filter out undefined values", () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const results: LighthouseRawResult[] = [
        { inp: "100" },
        { inp: undefined },
        { inp: "200" },
        { inp: undefined },
      ];

      const values = (runner as any).extractMetricValues(results, "inp");

      expect(values).toEqual(["100", "200"]);
      expect(values.length).toBe(2);
    });

    it("should return empty array when all values are undefined", () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const results: LighthouseRawResult[] = [
        { inp: undefined },
        { inp: undefined },
        { inp: undefined },
      ];

      const values = (runner as any).extractMetricValues(results, "inp");

      expect(values).toEqual([]);
    });
  });

  describe("spawnCommand", () => {
    it("should have timeout event handler registered", () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 1,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const resultPromise = (runner as any).spawnCommand("echo", ["test"]);
      expect(resultPromise).toBeInstanceOf(Promise);

      resultPromise.catch(() => {});
    });

    it("should resolve with stdout when command completes successfully", async () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 1,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const result = await (runner as any).spawnCommand("echo", ["test"]);
      expect(result).toContain("test");
    });

    it("should reject when command fails with non-zero exit code", async () => {
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 1,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      await expect(
        (runner as any).spawnCommand(
          "this-command-definitely-does-not-exist-12345",
          [],
        ),
      ).rejects.toThrow();
    });
  });

  describe("parseLighthouseJsonOutput", () => {
    const createRunner = (): LighthouseRunner => {
      return new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 1,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    };

    describe("successful JSON parsing", () => {
      it("should parse all metrics from complete Lighthouse JSON output", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          categories: {
            performance: { score: 0.92 },
          },
          audits: {
            "largest-contentful-paint": { numericValue: 1234.5 },
            "interaction-to-next-paint": { numericValue: 150.2 },
            "cumulative-layout-shift": { numericValue: 0.05 },
            "total-blocking-time": { numericValue: 200.3 },
            "first-contentful-paint": { numericValue: 800.1 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.lcp).toBe("1234.5");
        expect(result.inp).toBe("150.2");
        expect(result.cls).toBe("0.05");
        expect(result.tbt).toBe("200.3");
        expect(result.fcp).toBe("800.1");
        expect(result.performanceScore).toBe("92");
      });

      it("should parse metrics with integer values", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          categories: {
            performance: { score: 0.95 },
          },
          audits: {
            "largest-contentful-paint": { numericValue: 1200 },
            "interaction-to-next-paint": { numericValue: 150 },
            "cumulative-layout-shift": { numericValue: 0 },
            "total-blocking-time": { numericValue: 200 },
            "first-contentful-paint": { numericValue: 800 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.lcp).toBe("1200");
        expect(result.inp).toBe("150");
        expect(result.cls).toBe("0");
        expect(result.tbt).toBe("200");
        expect(result.fcp).toBe("800");
        expect(result.performanceScore).toBe("95");
      });

      it("should parse partial JSON output with only some metrics", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          categories: {
            performance: { score: 0.88 },
          },
          audits: {
            "largest-contentful-paint": { numericValue: 1200 },
            "cumulative-layout-shift": { numericValue: 0.05 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.lcp).toBe("1200");
        expect(result.cls).toBe("0.05");
        expect(result.performanceScore).toBe("88");
        expect(result.inp).toBeUndefined();
        expect(result.tbt).toBeUndefined();
        expect(result.fcp).toBeUndefined();
      });

      it("should handle pages with no interactions (no INP)", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          categories: {
            performance: { score: 0.92 },
          },
          audits: {
            "largest-contentful-paint": { numericValue: 1200 },
            "cumulative-layout-shift": { numericValue: 0.05 },
            "total-blocking-time": { numericValue: 200 },
            "first-contentful-paint": { numericValue: 800 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.lcp).toBe("1200");
        expect(result.cls).toBe("0.05");
        expect(result.tbt).toBe("200");
        expect(result.fcp).toBe("800");
        expect(result.performanceScore).toBe("92");
        expect(result.inp).toBeUndefined();
      });

      it("should handle very small decimal values", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          audits: {
            "cumulative-layout-shift": { numericValue: 0.001 },
            "largest-contentful-paint": { numericValue: 0.5 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.cls).toBe("0.001");
        expect(result.lcp).toBe("0.5");
      });

      it("should handle very large metric values", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          audits: {
            "largest-contentful-paint": { numericValue: 99999.99 },
            "total-blocking-time": { numericValue: 5000.5 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.lcp).toBe("99999.99");
        expect(result.tbt).toBe("5000.5");
      });
    });

    describe("edge cases and malformed JSON", () => {
      it("should return all undefined for empty string", () => {
        const runner = createRunner();
        const result = (runner as any).parseLighthouseJsonOutput("");

        expect(result.lcp).toBeUndefined();
        expect(result.inp).toBeUndefined();
        expect(result.cls).toBeUndefined();
        expect(result.tbt).toBeUndefined();
        expect(result.fcp).toBeUndefined();
        expect(result.performanceScore).toBeUndefined();
      });

      it("should return all undefined for invalid JSON", () => {
        const runner = createRunner();
        const result = (runner as any).parseLighthouseJsonOutput(
          "not valid json {{{",
        );

        expect(result.lcp).toBeUndefined();
        expect(result.performanceScore).toBeUndefined();
      });

      it("should handle JSON with null audits", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          categories: { performance: { score: 0.85 } },
          audits: null,
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.performanceScore).toBe("85");
        expect(result.lcp).toBeUndefined();
      });

      it("should handle JSON with missing numericValue", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          audits: {
            "largest-contentful-paint": { displayValue: "1.2s" },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.lcp).toBeUndefined();
      });

      it("should handle score as number (0-1 range)", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          categories: {
            performance: { score: 0.92 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.performanceScore).toBe("92");
      });

      it("should handle score as number (0-100 range)", () => {
        const runner = createRunner();
        const jsonOutput = JSON.stringify({
          categories: {
            performance: { score: 92 },
          },
        });

        const result = (runner as any).parseLighthouseJsonOutput(jsonOutput);

        expect(result.performanceScore).toBe("92");
      });
    });
  });
});
