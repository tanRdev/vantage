import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from "vitest";

import { ThresholdEngine, type RuntimeThresholds } from "../../src/core/threshold";

describe("ThresholdEngine", () => {
  let engine: ThresholdEngine;

  beforeEach(() => {
    engine = new ThresholdEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("compareBundleSize", () => {
    it("should pass when size does not exceed warning threshold", () => {
      const result = engine.compareBundleSize(105, 100, 10, 5);

      expect(result.passed).toBe(true);
      expect(result.status).toBe("pass");
      expect(result.delta).toBe(5);
    });

    it("should warn when size exceeds warning but not regression threshold", () => {
      const result = engine.compareBundleSize(108, 100, 10, 5);

      expect(result.passed).toBe(true);
      expect(result.status).toBe("warn");
      expect(result.delta).toBe(8);
      expect(result.message).toBeDefined();
    });

    it("should fail when size exceeds regression threshold", () => {
      const result = engine.compareBundleSize(115, 100, 10, 5);

      expect(result.passed).toBe(false);
      expect(result.status).toBe("fail");
      expect(result.delta).toBe(15);
      expect(result.message).toBeDefined();
    });

    it("should handle zero previous size", () => {
      const result = engine.compareBundleSize(100, 0, 10, 5);

      expect(result.passed).toBe(false);
      expect(result.status).toBe("fail");
      expect(result.message).toBeDefined();
    });
  });

  describe("compareRuntimeMetric", () => {
    const thresholds: RuntimeThresholds = {
      lcp: 2500,
      inp: 200,
      cls: 0.1,
    };

    it("should pass when metric is under threshold", () => {
      const result = engine.compareRuntimeMetric(2000, thresholds, "lcp");

      expect(result.passed).toBe(true);
      expect(result.status).toBe("pass");
      expect(result.delta).toBe(-500);
    });

    it("should pass when metric equals threshold", () => {
      const result = engine.compareRuntimeMetric(2500, thresholds, "lcp");

      expect(result.passed).toBe(true);
      expect(result.status).toBe("pass");
      expect(result.delta).toBe(0);
    });

    it("should fail when metric exceeds threshold", () => {
      const result = engine.compareRuntimeMetric(3000, thresholds, "lcp");

      expect(result.passed).toBe(false);
      expect(result.status).toBe("fail");
      expect(result.delta).toBe(500);
      expect(result.message).toBeDefined();
    });

    it("should pass when threshold is not defined", () => {
      const result = engine.compareRuntimeMetric(5000, thresholds, "tbt" as keyof RuntimeThresholds);

      expect(result.passed).toBe(true);
      expect(result.status).toBe("pass");
    });

    it("should handle CLS correctly", () => {
      const passResult = engine.compareRuntimeMetric(0.05, thresholds, "cls");
      expect(passResult.passed).toBe(true);
      expect(passResult.status).toBe("pass");

      const failResult = engine.compareRuntimeMetric(0.15, thresholds, "cls");
      expect(failResult.passed).toBe(false);
      expect(failResult.status).toBe("fail");
    });
  });

  describe("calculateScore", () => {
    it("should calculate score correctly", () => {
      const results = [
        { passed: true, delta: 0, status: "pass" },
        { passed: true, delta: 0, status: "pass" },
        { passed: false, delta: 100, status: "fail" },
        { passed: true, delta: 0, status: "pass" },
      ];

      const score = engine.calculateScore(results);
      expect(score).toBe(75);
    });

    it("should return 100 when all pass", () => {
      const results = [
        { passed: true, delta: 0, status: "pass" },
        { passed: true, delta: 0, status: "pass" },
      ];

      const score = engine.calculateScore(results);
      expect(score).toBe(100);
    });

    it("should return 0 when all fail", () => {
      const results = [
        { passed: false, delta: 100, status: "fail" },
        { passed: false, delta: 100, status: "fail" },
      ];

      const score = engine.calculateScore(results);
      expect(score).toBe(0);
    });
  });

  describe("shouldBlockPR", () => {
    it("should block when there are failures", () => {
      const results = [
        { passed: true, delta: 0, status: "pass" },
        { passed: false, delta: 100, status: "fail" },
        { passed: true, delta: 0, status: "pass" },
      ];

      expect(ThresholdEngine.shouldBlockPR(results)).toBe(true);
    });

    it("should not block when all pass", () => {
      const results = [
        { passed: true, delta: 0, status: "pass" },
        { passed: true, delta: 0, status: "pass" },
      ];

      expect(ThresholdEngine.shouldBlockPR(results)).toBe(false);
    });

    it("should not block when only warnings", () => {
      const results = [
        { passed: true, delta: 0, status: "warn" },
        { passed: true, delta: 0, status: "pass" },
      ];

      expect(ThresholdEngine.shouldBlockPR(results)).toBe(false);
    });
  });

  describe("shouldWarn", () => {
    it("should warn when there are warnings", () => {
      const results = [
        { passed: true, delta: 0, status: "warn" },
        { passed: true, delta: 0, status: "pass" },
      ];

      expect(ThresholdEngine.shouldWarn(results)).toBe(true);
    });

    it("should warn when there are failures", () => {
      const results = [
        { passed: false, delta: 100, status: "fail" },
        { passed: true, delta: 0, status: "pass" },
      ];

      expect(ThresholdEngine.shouldWarn(results)).toBe(true);
    });

    it("should not warn when all pass", () => {
      const results = [
        { passed: true, delta: 0, status: "pass" },
        { passed: true, delta: 0, status: "pass" },
      ];

      expect(ThresholdEngine.shouldWarn(results)).toBe(false);
    });
  });
});
