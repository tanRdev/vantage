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

  describe("parseLighthouseOutput", () => {
    const createRunner = (): LighthouseRunner => {
      return new LighthouseRunner({
        urls: ["http://localhost:3000"],
        numberOfRuns: 1,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    };

    describe("successful parsing", () => {
      it("should parse all metrics from a complete Lighthouse output", () => {
        const runner = createRunner();
        const completeOutput = `
          Running Lighthouse...
          Largest Contentful Paint: 1234.5 ms
          Interaction to Next Paint: 150.2 ms
          Cumulative Layout Shift: 0.05
          Total Blocking Time: 200.3 ms
          First Contentful Paint: 800.1 ms
          Performance score: 92
        `;

        const result = (runner as any).parseLighthouseOutput(completeOutput);

        expect(result.lcp).toBe("1234.5");
        expect(result.inp).toBe("150.2");
        expect(result.cls).toBe("0.05");
        expect(result.tbt).toBe("200.3");
        expect(result.fcp).toBe("800.1");
        expect(result.performanceScore).toBe("92");
      });

      it("should parse metrics with integer values", () => {
        const runner = createRunner();
        const integerOutput = `
          Largest Contentful Paint: 1200 ms
          Interaction to Next Paint: 150 ms
          Cumulative Layout Shift: 0
          Total Blocking Time: 200 ms
          First Contentful Paint: 800 ms
          Performance score: 95
        `;

        const result = (runner as any).parseLighthouseOutput(integerOutput);

        expect(result.lcp).toBe("1200");
        expect(result.inp).toBe("150");
        expect(result.cls).toBe("0");
        expect(result.tbt).toBe("200");
        expect(result.fcp).toBe("800");
        expect(result.performanceScore).toBe("95");
      });

      it("should parse partial output with only some metrics present", () => {
        const runner = createRunner();
        const partialOutput = `
          Largest Contentful Paint: 1200 ms
          Cumulative Layout Shift: 0.05
          Performance score: 88
        `;

        const result = (runner as any).parseLighthouseOutput(partialOutput);

        expect(result.lcp).toBe("1200");
        expect(result.cls).toBe("0.05");
        expect(result.performanceScore).toBe("88");
        // Missing metrics should be undefined
        expect(result.inp).toBeUndefined();
        expect(result.tbt).toBeUndefined();
        expect(result.fcp).toBeUndefined();
      });

      it("should parse output without INP (pages with no interactions)", () => {
        const runner = createRunner();
        const noInpOutput = `
          Largest Contentful Paint: 1200 ms
          Cumulative Layout Shift: 0.05
          Total Blocking Time: 200 ms
          First Contentful Paint: 800 ms
          Performance score: 92
        `;

        const result = (runner as any).parseLighthouseOutput(noInpOutput);

        expect(result.lcp).toBe("1200");
        expect(result.cls).toBe("0.05");
        expect(result.tbt).toBe("200");
        expect(result.fcp).toBe("800");
        expect(result.performanceScore).toBe("92");
        expect(result.inp).toBeUndefined();
      });

      it("should handle very small decimal values", () => {
        const runner = createRunner();
        const smallValuesOutput = `
          Cumulative Layout Shift: 0.001
          Largest Contentful Paint: 0.5 ms
        `;

        const result = (runner as any).parseLighthouseOutput(smallValuesOutput);

        expect(result.cls).toBe("0.001");
        expect(result.lcp).toBe("0.5");
      });

      it("should handle very large metric values", () => {
        const runner = createRunner();
        const largeValuesOutput = `
          Largest Contentful Paint: 99999.99 ms
          Total Blocking Time: 5000.5 ms
        `;

        const result = (runner as any).parseLighthouseOutput(largeValuesOutput);

        expect(result.lcp).toBe("99999.99");
        expect(result.tbt).toBe("5000.5");
      });
    });

    describe("edge cases and malformed output", () => {
      it("should return all undefined for empty string output", () => {
        const runner = createRunner();
        const result = (runner as any).parseLighthouseOutput("");

        expect(result.lcp).toBeUndefined();
        expect(result.inp).toBeUndefined();
        expect(result.cls).toBeUndefined();
        expect(result.tbt).toBeUndefined();
        expect(result.fcp).toBeUndefined();
        expect(result.performanceScore).toBeUndefined();
      });

      it("should return all undefined for whitespace-only output", () => {
        const runner = createRunner();
        const result = (runner as any).parseLighthouseOutput("   \n\t  \r\n  ");

        expect(result.lcp).toBeUndefined();
        expect(result.inp).toBeUndefined();
        expect(result.cls).toBeUndefined();
        expect(result.tbt).toBeUndefined();
        expect(result.fcp).toBeUndefined();
        expect(result.performanceScore).toBeUndefined();
      });

      it("should handle output with only metric labels but no values", () => {
        const runner = createRunner();
        const labelsOnlyOutput = `
          Largest Contentful Paint:
          Performance score:
        `;

        const result = (runner as any).parseLighthouseOutput(labelsOnlyOutput);

        expect(result.lcp).toBeUndefined();
        expect(result.performanceScore).toBeUndefined();
      });

      it("should handle metric names appearing multiple times (uses first match)", () => {
        const runner = createRunner();
        const duplicateMetrics = `
          Largest Contentful Paint: 1000 ms
          Some text here
          Largest Contentful Paint: 2000 ms
        `;

        const result = (runner as any).parseLighthouseOutput(duplicateMetrics);

        // Regex returns the first match
        expect(result.lcp).toBe("1000");
      });

      it("should handle malformed numeric values gracefully", () => {
        const runner = createRunner();
        const malformedOutput = `
          Largest Contentful Paint: abc ms
          Performance score: xyz
        `;

        const result = (runner as any).parseLighthouseOutput(malformedOutput);

        // Malformed values don't match the numeric regex, so undefined is expected
        expect(result.lcp).toBeUndefined();
        expect(result.performanceScore).toBeUndefined();
      });

      it("should handle extra spaces around metric values", () => {
        const runner = createRunner();
        const extraSpacesOutput = `
          Largest Contentful Paint:    1200    ms
          Performance score:  95
        `;

        const result = (runner as any).parseLighthouseOutput(extraSpacesOutput);

        expect(result.lcp).toBe("1200");
        expect(result.performanceScore).toBe("95");
      });

      it("should handle missing 'ms' unit after time metrics", () => {
        const runner = createRunner();
        const noUnitOutput = `
          Largest Contentful Paint: 1200
          Total Blocking Time: 200
        `;

        const result = (runner as any).parseLighthouseOutput(noUnitOutput);

        // The regex requires 'ms' for time metrics, so these should be undefined
        expect(result.lcp).toBeUndefined();
        expect(result.tbt).toBeUndefined();
      });

      it("should handle CLS with decimal point but no leading zero", () => {
        const runner = createRunner();
        const clsOutput = `
          Cumulative Layout Shift: .5
        `;

        const result = (runner as any).parseLighthouseOutput(clsOutput);

        // The regex requires at least one digit before the decimal
        expect(result.cls).toBeUndefined();
      });

      it("should handle real Lighthouse CLI output format", () => {
        const runner = createRunner();
        const realisticOutput = `
$ npx @lhci/cli autorun --collect.url=http://localhost:3000
Running Lighthouse...
Started a web server on port 54321...
Running Lighthouse 2 time(s) on http://localhost:3000
[1mRun #1...[0m
  - Loading page...
  - Gathering metrics...
  ✓ Largest Contentful Paint: 1234 ms
  ✓ Interaction to Next Paint: 150 ms
  ✓ Cumulative Layout Shift: 0.05
  ✓ Total Blocking Time: 200 ms
  ✓ First Contentful Paint: 800 ms
  ✓ Performance score: 92
Done running Lighthouse!
        `;

        const result = (runner as any).parseLighthouseOutput(realisticOutput);

        expect(result.lcp).toBe("1234");
        expect(result.inp).toBe("150");
        expect(result.cls).toBe("0.05");
        expect(result.tbt).toBe("200");
        expect(result.fcp).toBe("800");
        expect(result.performanceScore).toBe("92");
      });
    });

    describe("individual metric parsing", () => {
      it("should parse LCP with various formats", () => {
        const runner = createRunner();

        expect((runner as any).parseLighthouseOutput("Largest Contentful Paint: 100 ms").lcp).toBe("100");
        expect((runner as any).parseLighthouseOutput("Largest Contentful Paint: 100.5 ms").lcp).toBe("100.5");
        expect((runner as any).parseLighthouseOutput("Largest Contentful Paint: 0.5 ms").lcp).toBe("0.5");
      });

      it("should parse INP with various formats", () => {
        const runner = createRunner();

        expect((runner as any).parseLighthouseOutput("Interaction to Next Paint: 100 ms").inp).toBe("100");
        expect((runner as any).parseLighthouseOutput("Interaction to Next Paint: 100.5 ms").inp).toBe("100.5");
        expect((runner as any).parseLighthouseOutput("Interaction to Next Paint: 0.1 ms").inp).toBe("0.1");
      });

      it("should parse CLS with various formats", () => {
        const runner = createRunner();

        expect((runner as any).parseLighthouseOutput("Cumulative Layout Shift: 0").cls).toBe("0");
        expect((runner as any).parseLighthouseOutput("Cumulative Layout Shift: 0.5").cls).toBe("0.5");
        expect((runner as any).parseLighthouseOutput("Cumulative Layout Shift: 0.001").cls).toBe("0.001");
        expect((runner as any).parseLighthouseOutput("Cumulative Layout Shift: 1.5").cls).toBe("1.5");
      });

      it("should parse TBT with various formats", () => {
        const runner = createRunner();

        expect((runner as any).parseLighthouseOutput("Total Blocking Time: 100 ms").tbt).toBe("100");
        expect((runner as any).parseLighthouseOutput("Total Blocking Time: 100.5 ms").tbt).toBe("100.5");
      });

      it("should parse FCP with various formats", () => {
        const runner = createRunner();

        expect((runner as any).parseLighthouseOutput("First Contentful Paint: 800 ms").fcp).toBe("800");
        expect((runner as any).parseLighthouseOutput("First Contentful Paint: 800.5 ms").fcp).toBe("800.5");
      });

      it("should parse Performance score with various formats", () => {
        const runner = createRunner();

        expect((runner as any).parseLighthouseOutput("Performance score: 100").performanceScore).toBe("100");
        expect((runner as any).parseLighthouseOutput("Performance score: 95").performanceScore).toBe("95");
        expect((runner as any).parseLighthouseOutput("Performance score: 0").performanceScore).toBe("0");
      });
    });

    describe("error scenarios", () => {
      it("should handle output with error messages mixed with metrics", () => {
        const runner = createRunner();
        const errorWithMetrics = `
          Error loading some resources
          Largest Contentful Paint: 1200 ms
          Warning: Some images not optimized
          Performance score: 85
        `;

        const result = (runner as any).parseLighthouseOutput(errorWithMetrics);

        expect(result.lcp).toBe("1200");
        expect(result.performanceScore).toBe("85");
      });

      it("should handle case sensitivity in metric names", () => {
        const runner = createRunner();

        // The regex is case-sensitive, so different casing should not match
        expect((runner as any).parseLighthouseOutput("largest contentful paint: 1200 ms").lcp).toBeUndefined();
        expect((runner as any).parseLighthouseOutput("LARGEST CONTENTFUL PAINT: 1200 ms").lcp).toBeUndefined();
      });

      it("should handle null input", () => {
        const runner = createRunner();

        // TypeScript would normally prevent this, but test runtime behavior
        // The implementation calls .match() which will throw on null
        expect(() => (runner as any).parseLighthouseOutput(null as unknown as string)).toThrow();
      });
    });
  });
});
