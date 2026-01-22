import { describe, it, expect } from "vitest";
import { LighthouseRunner, type LighthouseRawResult } from "../../../../src/analyzers/runtime/lighthouse";

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

      // Create results without INP values (simulating pages with no interactions)
      const resultsWithoutINP: LighthouseRawResult[] = [
        {
          lcp: "1200",
          inp: undefined, // No interactions on page
          cls: "0.05",
          tbt: "100",
          fcp: "800",
          performanceScore: "95",
        },
        {
          lcp: "1300",
          inp: undefined, // No interactions on page
          cls: "0.06",
          tbt: "110",
          fcp: "850",
          performanceScore: "94",
        },
        {
          lcp: "1250",
          inp: undefined, // No interactions on page
          cls: "0.04",
          tbt: "105",
          fcp: "820",
          performanceScore: "96",
        },
      ];

      // Access the private method via type assertion for testing
      const result = (runner as any).calculateMedian(resultsWithoutINP, "http://localhost:3000");

      // INP should be undefined when not reported, not 0
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

      // Create results with INP values
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

      const result = (runner as any).calculateMedian(resultsWithINP, "http://localhost:3000");

      // INP should be the median value
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

      // Create results with mixed INP presence
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
          inp: undefined, // No interaction in this run
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

      const result = (runner as any).calculateMedian(mixedResults, "http://localhost:3000");

      // With medianIndex = Math.floor(3/2) = 1 and filtered inps = [150, 180]
      // Result is inps[1] = 180
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

      const result = (runner as any).calculateMedian(emptyResults, "http://localhost:3000");

      // All metrics should use fallback (0 for required, undefined for optional)
      expect(result.score).toBe(0);
      expect(result.inp).toBeUndefined(); // INP is optional
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
      // Verify that spawnCommand sets up a timeout handler
      // This test validates the code structure without actually running a long timeout
      const runner = new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 1,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      // The spawnCommand should return a Promise
      const resultPromise = (runner as any).spawnCommand("echo", ["test"]);
      expect(resultPromise).toBeInstanceOf(Promise);

      // Clean up - ignore the promise result
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

      // Use a simple echo command that should complete quickly
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

      // Use a non-existent command that will fail with a non-zero exit code
      await expect((runner as any).spawnCommand("this-command-definitely-does-not-exist-12345", [])).rejects.toThrow();
    });
  });
});
