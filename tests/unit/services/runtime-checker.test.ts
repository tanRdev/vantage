import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RuntimeChecker } from "../../../src/services/RuntimeChecker";
import type { NextjsInfo } from "../../../src/analyzers/bundle/nextjs";
import type { RuntimeConfig } from "../../../src/core/config";
import type { LighthouseResult } from "../../../src/analyzers/runtime/lighthouse";

// Mock all dependencies
vi.mock("../../../src/core/reporter");
vi.mock("../../../src/analyzers/runtime/routes");
vi.mock("../../../src/analyzers/runtime/lighthouse");
vi.mock("../../../src/core/threshold");

// Import mocked modules after mocking
import Reporter from "../../../src/core/reporter";
import { RouteDetector } from "../../../src/analyzers/runtime/routes";
import { LighthouseRunner } from "../../../src/analyzers/runtime/lighthouse";
import { ThresholdEngine } from "../../../src/core/threshold";

const mockReporter = vi.mocked(Reporter);
const mockRouteDetector = vi.mocked(RouteDetector);
const mockLighthouseRunner = vi.mocked(LighthouseRunner);
const mockThresholdEngine = vi.mocked(ThresholdEngine);

describe("RuntimeChecker", () => {
  let workingDir: string;
  let nextjsInfo: NextjsInfo;
  let config: RuntimeConfig;
  let runtimeChecker: RuntimeChecker;

  beforeEach(() => {
    vi.clearAllMocks();

    workingDir = "/test/project";
    nextjsInfo = {
      version: "14.0.0",
      routerType: "app",
      outputDir: "/test/project/.next",
      hasTurbopack: false,
    };

    config = {
      routes: ["/", "/about"],
      exclude: [],
      thresholds: {
        lcp: 2500,
        inp: 200,
        cls: 0.1,
        tbt: 300,
      },
      lighthouse: {
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
      },
    };

    // Setup default mock behaviors
    mockReporter.info = vi.fn();
    mockReporter.error = vi.fn();
    mockReporter.success = vi.fn();
    mockReporter.printMetricTable = vi.fn();

    runtimeChecker = new RuntimeChecker(workingDir, nextjsInfo, config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with working directory, Next.js info, and config", () => {
      const checker = new RuntimeChecker(workingDir, nextjsInfo, config);

      expect(checker).toBeInstanceOf(RuntimeChecker);
    });

    it("should accept config with minimal thresholds", () => {
      const minimalConfig: RuntimeConfig = {
        routes: ["/"],
        thresholds: { lcp: 2500 },
      };

      const checker = new RuntimeChecker(workingDir, nextjsInfo, minimalConfig);

      expect(checker).toBeInstanceOf(RuntimeChecker);
    });
  });

  describe("check", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      // Setup RouteDetector mock
      mockRouteDetectorInstance = {
        detectRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/about",
            type: "app" as const,
            isDynamic: false,
            segments: ["about"],
          },
          {
            path: "/blog/[id]",
            type: "app" as const,
            isDynamic: true,
            segments: ["blog", "[id]"],
          },
        ]),
        getTopNRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/about",
            type: "app" as const,
            isDynamic: false,
            segments: ["about"],
          },
        ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      // Setup LighthouseRunner mock
      const mockLighthouseResults: LighthouseResult[] = [
        {
          url: "http://localhost:3000/",
          lcp: 2000,
          inp: 150,
          cls: 0.05,
          tbt: 200,
          fcp: 1000,
          score: 95,
        },
        {
          url: "http://localhost:3000/about",
          lcp: 1800,
          inp: 120,
          cls: 0.03,
          tbt: 150,
          fcp: 900,
          score: 97,
        },
      ];

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue(mockLighthouseResults),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      // Setup ThresholdEngine mock
      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: -500,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      config = {
        ...config,
        routes: ["/", "/about"],
      };
      runtimeChecker = new RuntimeChecker(workingDir, nextjsInfo, config);
    });

    it("should complete the full orchestration flow successfully", async () => {
      await expect(runtimeChecker.check()).resolves.not.toThrow();

      // Verify route detection was called
      expect(mockRouteDetector).toHaveBeenCalledWith(
        workingDir,
        nextjsInfo.routerType,
      );
      expect(mockRouteDetectorInstance.detectRoutes).toHaveBeenCalledWith([]);

      // Verify LighthouseRunner was created with correct config
      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: ["http://localhost:3000/", "http://localhost:3000/about"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      // Verify Lighthouse was run
      expect(mockLighthouseRunnerInstance.run).toHaveBeenCalled();

      // Verify threshold checking was called
      expect(mockThresholdEngine.shouldBlockPR).toHaveBeenCalled();

      // Verify success message
      expect(mockReporter.success).toHaveBeenCalledWith(
        "All runtime checks passed!",
      );
    });

    it("should use default lighthouse config when not provided", async () => {
      const configWithoutLighthouse: RuntimeConfig = {
        routes: ["/"],
        thresholds: { lcp: 2500 },
      };

      const checker = new RuntimeChecker(
        workingDir,
        nextjsInfo,
        configWithoutLighthouse,
      );

      await checker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: expect.any(Array),
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    });

    it("should pass exclude patterns to route detector", async () => {
      const configWithExclude: RuntimeConfig = {
        routes: ["/"],
        exclude: ["/api/*", "/admin/*"],
        thresholds: { lcp: 2500 },
      };

      const checker = new RuntimeChecker(
        workingDir,
        nextjsInfo,
        configWithExclude,
      );

      await checker.check();

      expect(mockRouteDetectorInstance.detectRoutes).toHaveBeenCalledWith([
        "/api/*",
        "/admin/*",
      ]);
    });

    it("should throw error with code 1 when thresholds are exceeded", async () => {
      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(true);

      await expect(runtimeChecker.check()).rejects.toThrow(
        "Performance thresholds exceeded",
      );

      const error = await runtimeChecker.check().catch((e) => e);
      expect(error.code).toBe(1);
      expect(mockReporter.error).toHaveBeenCalledWith(
        "Performance thresholds exceeded!",
      );
    });

    it("should log progress messages during execution", async () => {
      await runtimeChecker.check();

      expect(mockReporter.info).toHaveBeenCalledWith("Detecting routes...");
      expect(mockReporter.info).toHaveBeenCalledWith("Found 3 routes");
      expect(mockReporter.info).toHaveBeenCalledWith("Testing 2 routes:");
      expect(mockReporter.info).toHaveBeenCalledWith("Running Lighthouse...");
    });

    it("should log each route being tested", async () => {
      await runtimeChecker.check();

      expect(mockReporter.info).toHaveBeenCalledWith("  - /");
      expect(mockReporter.info).toHaveBeenCalledWith("  - /about");
    });

    it("should call printMetricTable with processed results", async () => {
      await runtimeChecker.check();

      expect(mockReporter.printMetricTable).toHaveBeenCalled();
      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];

      // Should have metrics for each route (LCP, INP, CLS, TBT, Score)
      expect(printedResults.length).toBeGreaterThan(0);

      // Check that results have the expected structure
      expect(printedResults[0]).toHaveProperty("name");
      expect(printedResults[0]).toHaveProperty("current");
      expect(printedResults[0]).toHaveProperty("previous");
      expect(printedResults[0]).toHaveProperty("delta");
      expect(printedResults[0]).toHaveProperty("status");
    });
  });

  describe("check - threshold evaluation", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );
    });

    it("should pass when all metrics are under thresholds", async () => {
      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: -500,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      await expect(runtimeChecker.check()).resolves.not.toThrow();
      expect(mockReporter.success).toHaveBeenCalledWith(
        "All runtime checks passed!",
      );
    });

    it("should block when any metric fails threshold", async () => {
      // Simulate one failing metric - return default pass for others, fail for one
      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: false,
        status: "fail" as const,
        delta: 50,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(true);

      await expect(runtimeChecker.check()).rejects.toThrow(
        "Performance thresholds exceeded",
      );
      expect(mockReporter.error).toHaveBeenCalledWith(
        "Performance thresholds exceeded!",
      );
    });
  });

  describe("check - edge cases", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: 0,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      config = {
        ...config,
        routes: ["/"],
      };
      runtimeChecker = new RuntimeChecker(workingDir, nextjsInfo, config);
    });

    it("should handle routes with query strings in URL", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/?test=1",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      expect(mockReporter.printMetricTable).toHaveBeenCalled();
    });

    it("should handle result with undefined INP (no interactions)", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: undefined,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await expect(runtimeChecker.check()).resolves.not.toThrow();
    });

    it("should handle empty routes list", async () => {
      const configWithNoRoutes: RuntimeConfig = {
        ...config,
        routes: [],
      };

      const checker = new RuntimeChecker(
        workingDir,
        nextjsInfo,
        configWithNoRoutes,
      );

      await checker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: [],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    });
  });

  describe("check - LighthouseRunner orchestration", () => {
    let mockRouteDetectorInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: 0,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      config = {
        ...config,
        routes: ["/"],
      };
      runtimeChecker = new RuntimeChecker(workingDir, nextjsInfo, config);
    });

    it("should construct correct URLs for routes", async () => {
      const mockInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(() => mockInstance);

      await runtimeChecker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: ["http://localhost:3000/"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    });

    it("should use baseUrl when constructing URLs", async () => {
      const configWithBaseUrl: RuntimeConfig = {
        ...config,
        baseUrl: "https://example.com/base",
        routes: ["/", "/about"],
      };

      const checker = new RuntimeChecker(
        workingDir,
        nextjsInfo,
        configWithBaseUrl,
      );

      const mockInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "https://example.com/base/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(() => mockInstance);

      await checker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: ["https://example.com/base/", "https://example.com/base/about"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    });

    it("should handle LighthouseRunner errors", async () => {
      const mockInstance = {
        run: vi.fn().mockRejectedValue(new Error("Lighthouse failed")),
      };

      mockLighthouseRunner.mockImplementation(() => mockInstance);

      await expect(runtimeChecker.check()).rejects.toThrow("Lighthouse failed");
    });
  });

  describe("processResults - metric processing", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: -500,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);
    });

    it("should process LCP metric when threshold is configured", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      expect(mockThresholdEngine.compareRuntimeMetric).toHaveBeenCalledWith(
        2000,
        config.thresholds,
        "lcp",
      );
    });

    it("should process INP metric when threshold is configured", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      expect(mockThresholdEngine.compareRuntimeMetric).toHaveBeenCalledWith(
        150,
        config.thresholds,
        "inp",
      );
    });

    it("should process CLS metric when threshold is configured", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      expect(mockThresholdEngine.compareRuntimeMetric).toHaveBeenCalledWith(
        0.05,
        config.thresholds,
        "cls",
      );
    });

    it("should process TBT metric when threshold is configured", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      expect(mockThresholdEngine.compareRuntimeMetric).toHaveBeenCalledWith(
        200,
        config.thresholds,
        "tbt",
      );
    });

    it("should include performance score in results", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 92,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];
      const scoreResult = printedResults.find(
        (r: any) => r.name === "Score (/)",
      );

      // Score of 92 should be reported as 92
      expect(scoreResult).toBeDefined();
      expect(scoreResult.current).toBe("92");
    });

    it("should skip metric processing when threshold is not configured", async () => {
      const configWithoutAllThresholds: RuntimeConfig = {
        routes: ["/"],
        thresholds: { lcp: 2500 }, // Only LCP configured
      };

      const checker = new RuntimeChecker(
        workingDir,
        nextjsInfo,
        configWithoutAllThresholds,
      );

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await checker.check();

      // Should only be called for lcp and score
      expect(mockThresholdEngine.compareRuntimeMetric).toHaveBeenCalledWith(
        2000,
        configWithoutAllThresholds.thresholds,
        "lcp",
      );
    });
  });

  describe("check - multiple routes", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/about",
            type: "app" as const,
            isDynamic: false,
            segments: ["about"],
          },
          {
            path: "/contact",
            type: "app" as const,
            isDynamic: false,
            segments: ["contact"],
          },
          {
            path: "/blog",
            type: "app" as const,
            isDynamic: false,
            segments: ["blog"],
          },
          {
            path: "/api/users",
            type: "api" as const,
            isDynamic: false,
            segments: ["api", "users"],
          },
        ]),
        getTopNRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/about",
            type: "app" as const,
            isDynamic: false,
            segments: ["about"],
          },
          {
            path: "/contact",
            type: "app" as const,
            isDynamic: false,
            segments: ["contact"],
          },
        ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
          {
            url: "http://localhost:3000/about",
            lcp: 1800,
            inp: 120,
            cls: 0.03,
            tbt: 150,
            fcp: 900,
            score: 97,
          },
          {
            url: "http://localhost:3000/contact",
            lcp: 2100,
            inp: 160,
            cls: 0.04,
            tbt: 180,
            fcp: 950,
            score: 94,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: 0,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      config = {
        ...config,
        routes: ["/", "/about", "/contact"],
      };
      runtimeChecker = new RuntimeChecker(workingDir, nextjsInfo, config);
    });

    it("should process results for all routes", async () => {
      await runtimeChecker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: [
          "http://localhost:3000/",
          "http://localhost:3000/about",
          "http://localhost:3000/contact",
        ],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];

      // Should have results for 3 routes * 5 metrics each (LCP, INP, CLS, TBT, Score)
      expect(printedResults.length).toBe(15);
    });
  });

  describe("check - performance score threshold", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: 0,
      });
    });

    it("should mark score as pass when >= 90", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 90,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );
      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      await runtimeChecker.check();

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];
      const scoreResult = printedResults.find(
        (r: any) => r.name === "Score (/)",
      );

      expect(scoreResult.status).toBe("pass");
    });

    it("should mark score as fail when < 90", async () => {
      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 89,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      // Return true for shouldBlockPR to simulate blocking on low score
      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(true);

      await expect(runtimeChecker.check()).rejects.toThrow(
        "Performance thresholds exceeded",
      );

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];
      const scoreResult = printedResults.find(
        (r: any) => r.name === "Score (/)",
      );

      expect(scoreResult.status).toBe("fail");
    });
  });

  describe("check - dynamic route handling", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/blog/[id]",
            type: "app" as const,
            isDynamic: true,
            segments: ["blog", "[id]"],
          },
        ]),
        getTopNRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/blog/[id]",
            type: "app" as const,
            isDynamic: true,
            segments: ["blog", "[id]"],
          },
        ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
          {
            url: "http://localhost:3000/blog/[id]",
            lcp: 2100,
            inp: 160,
            cls: 0.06,
            tbt: 220,
            fcp: 1100,
            score: 93,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: 0,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      config = {
        ...config,
        routes: ["/", "/blog/[id]"],
      };
      runtimeChecker = new RuntimeChecker(workingDir, nextjsInfo, config);
    });

    it("should include dynamic routes in testing", async () => {
      await runtimeChecker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: ["http://localhost:3000/", "http://localhost:3000/blog/[id]"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    });
  });

  describe("check - route filtering", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: 0,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);

      config = {
        ...config,
        routes: ["/"],
      };
      runtimeChecker = new RuntimeChecker(workingDir, nextjsInfo, config);
    });

    it("should filter out api routes by default", async () => {
      mockRouteDetectorInstance = {
        detectRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/api/users",
            type: "api" as const,
            isDynamic: false,
            segments: ["api", "users"],
          },
        ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: ["http://localhost:3000/"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    });

    it("should filter out middleware routes by default", async () => {
      mockRouteDetectorInstance = {
        detectRoutes: vi.fn().mockReturnValue([
          { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          {
            path: "/middleware/auth",
            type: "middleware" as const,
            isDynamic: false,
            segments: ["middleware", "auth"],
          },
        ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2000,
            inp: 150,
            cls: 0.05,
            tbt: 200,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      await runtimeChecker.check();

      expect(mockLighthouseRunner).toHaveBeenCalledWith({
        urls: ["http://localhost:3000/"],
        numberOfRuns: 3,
        preset: "desktop",
        throttling: "fast-3g",
        outputDir: ".vantage/lighthouse",
      });
    });
  });

  describe("check - result formatting", () => {
    let mockRouteDetectorInstance: any;
    let mockLighthouseRunnerInstance: any;

    beforeEach(() => {
      mockRouteDetectorInstance = {
        detectRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
        getTopNRoutes: vi
          .fn()
          .mockReturnValue([
            { path: "/", type: "app" as const, isDynamic: false, segments: [] },
          ]),
      };

      mockRouteDetector.mockImplementation(() => mockRouteDetectorInstance);

      mockLighthouseRunnerInstance = {
        run: vi.fn().mockResolvedValue([
          {
            url: "http://localhost:3000/",
            lcp: 2345.67,
            inp: 123.45,
            cls: 0.123,
            tbt: 234.56,
            fcp: 1000,
            score: 95,
          },
        ]),
      };

      mockLighthouseRunner.mockImplementation(
        () => mockLighthouseRunnerInstance,
      );

      mockThresholdEngine.compareRuntimeMetric = vi.fn().mockReturnValue({
        passed: true,
        status: "pass" as const,
        delta: -500,
      });

      mockThresholdEngine.shouldBlockPR = vi.fn().mockReturnValue(false);
    });

    it("should format LCP as milliseconds without decimals", async () => {
      await runtimeChecker.check();

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];
      const lcpResult = printedResults.find((r: any) => r.name === "LCP (/)");

      expect(lcpResult.current).toBe("2346ms");
    });

    it("should format INP as milliseconds without decimals", async () => {
      await runtimeChecker.check();

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];
      const inpResult = printedResults.find((r: any) => r.name === "INP (/)");

      expect(inpResult.current).toBe("123ms");
    });

    it("should format CLS with 3 decimal places", async () => {
      await runtimeChecker.check();

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];
      const clsResult = printedResults.find((r: any) => r.name === "CLS (/)");

      expect(clsResult.current).toBe("0.123");
    });

    it("should format TBT as milliseconds without decimals", async () => {
      await runtimeChecker.check();

      const printedResults = mockReporter.printMetricTable.mock.calls[0][0];
      const tbtResult = printedResults.find((r: any) => r.name === "TBT (/)");

      expect(tbtResult.current).toBe("235ms");
    });
  });
});
