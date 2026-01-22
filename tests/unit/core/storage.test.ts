import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import { Storage, type RuntimeMetricRecord, closeStorage, getStorage } from "../../../src/core/storage";

describe("Storage", () => {
  let storage: Storage;
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test database
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vantage-test-"));
    storage = new Storage(tempDir);
  });

  afterEach(() => {
    try {
      storage?.close();
    } catch {
      // Ignore errors
    }
    closeStorage();
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("database connection lifecycle and cleanup", () => {
    it("should open a database connection when created", () => {
      const dbFile = path.join(tempDir, "metrics.db");
      expect(fs.existsSync(dbFile)).toBe(true);
    });

    it("should close the database connection when close() is called", () => {
      const closeSpy = vi.spyOn(storage as any, "unregisterCleanupHandlers");
      storage.close();
      // First close calls unregisterCleanupHandlers
      expect(closeSpy).toHaveBeenCalledTimes(1);
      storage.close(); // Should be idempotent - returns early
      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it("should allow operations after close() without throwing", () => {
      storage.close();
      expect(() => storage.close()).not.toThrow();
    });

    it("should register cleanup handlers for shutdown signals", () => {
      const initialListenerCount = process.listenerCount("SIGTERM");
      const tempDir2 = fs.mkdtempSync(path.join(os.tmpdir(), "vantage-test-"));
      const storage2 = new Storage(tempDir2);

      // Only register if no existing listeners
      const actualListenerCount = process.listenerCount("SIGTERM");
      expect(actualListenerCount).toBeGreaterThanOrEqual(initialListenerCount);

      storage2.close();
      fs.rmSync(tempDir2, { recursive: true, force: true });
    });

    it("should unregister cleanup handlers when closed", () => {
      const initialBeforeExitCount = process.listenerCount("beforeExit");
      storage = new Storage(tempDir);
      const afterCreateBeforeExitCount = process.listenerCount("beforeExit");
      storage.close();
      const afterCloseBeforeExitCount = process.listenerCount("beforeExit");

      // The beforeExit handler should be unregistered
      expect(afterCloseBeforeExitCount).toBeLessThan(afterCreateBeforeExitCount);
    });

    it("should return the same instance when calling getStorage multiple times", () => {
      const storage1 = getStorage(tempDir);
      const storage2 = getStorage(tempDir);
      expect(storage1).toBe(storage2);
      closeStorage();
    });

    it("should create a new instance after closeStorage is called", () => {
      const storage1 = getStorage(tempDir);
      closeStorage();
      const storage2 = getStorage(tempDir);
      expect(storage1).not.toBe(storage2);
      closeStorage();
    });
  });

  describe("getRuntimeTrend", () => {
    const validMetrics: Array<keyof Pick<RuntimeMetricRecord, "lcp" | "inp" | "cls" | "fcp" | "ttfb" | "score">> =
      ["lcp", "inp", "cls", "fcp", "ttfb", "score"];

    it("should accept all valid metric names", () => {
      // Insert test data
      const testData: Omit<RuntimeMetricRecord, "id">[] = [
        {
          timestamp: Date.now(),
          branch: "main",
          lcp: 1000,
          inp: 100,
          cls: 0.05,
          fcp: 800,
          ttfb: 200,
          score: 90,
          status: "pass",
        },
      ];
      storage.saveRuntimeMetrics(testData);

      // All valid metrics should work without throwing
      for (const metric of validMetrics) {
        expect(() => storage.getRuntimeTrend("main", metric)).not.toThrow();
      }
    });

    it("should throw error for invalid column names (SQL injection protection)", () => {
      // Insert test data
      const testData: Omit<RuntimeMetricRecord, "id">[] = [
        {
          timestamp: Date.now(),
          branch: "main",
          lcp: 1000,
          status: "pass",
        },
      ];
      storage.saveRuntimeMetrics(testData);

      // SQL injection attempts should throw
      const injectionAttempts = [
        "lcp; DROP TABLE runtime_metrics; --",
        "lcp OR 1=1 --",
        "lcp UNION SELECT * FROM bundle_metrics --",
        " nonexistent_column",
        "'; DROP TABLE runtime_metrics; --",
        "lcp/**/UNION/**/SELECT/**/1,2,3",
      ];

      for (const maliciousInput of injectionAttempts) {
        expect(() =>
          storage.getRuntimeTrend("main", maliciousInput as any)
        ).toThrow(/invalid metric/i);
      }
    });

    it("should return correct data for valid metric", () => {
      const now = Date.now();
      const testData: Omit<RuntimeMetricRecord, "id">[] = [
        {
          timestamp: now - 2000,
          branch: "main",
          lcp: 1000,
          status: "pass",
        },
        {
          timestamp: now - 1000,
          branch: "main",
          lcp: 1200,
          status: "pass",
        },
        {
          timestamp: now,
          branch: "main",
          lcp: 900,
          status: "pass",
        },
      ];
      storage.saveRuntimeMetrics(testData);

      const result = storage.getRuntimeTrend("main", "lcp");

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(1000);
      expect(result[1].value).toBe(1200);
      expect(result[2].value).toBe(900);
    });

    it("should filter out NULL values", () => {
      const now = Date.now();
      const testData: Omit<RuntimeMetricRecord, "id">[] = [
        {
          timestamp: now - 2000,
          branch: "main",
          lcp: 1000,
          status: "pass",
        },
        {
          timestamp: now - 1000,
          branch: "main",
          lcp: null, // This should be filtered out
          status: "pass",
        },
        {
          timestamp: now,
          branch: "main",
          lcp: 900,
          status: "pass",
        },
      ];
      storage.saveRuntimeMetrics(testData);

      const result = storage.getRuntimeTrend("main", "lcp");

      // Only 2 records should be returned (NULL values filtered)
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe(1000);
      expect(result[1].value).toBe(900);
    });

    it("should respect the limit parameter", () => {
      const now = Date.now();
      const testData: Omit<RuntimeMetricRecord, "id">[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: now - (49 - i) * 1000,
        branch: "main",
        lcp: 1000 + i * 10,
        status: "pass",
      }));
      storage.saveRuntimeMetrics(testData);

      const result = storage.getRuntimeTrend("main", "lcp", 10);

      expect(result).toHaveLength(10);
    });
  });
});
