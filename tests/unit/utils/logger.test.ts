import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

describe("Logger", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(async () => {
    vi.resetModules();

    // Create a temp directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vantage-logger-test-"));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    // Restore original cwd
    process.chdir(originalCwd);
  });

  describe("ensureLogDirectory behavior", () => {
    it("should create directory with recursive option when it does not exist", async () => {
      // Change to temp directory where .vantage doesn't exist
      process.chdir(tempDir);

      const testLogDir = path.join(process.cwd(), ".vantage");
      expect(fs.existsSync(testLogDir)).toBe(false);

      // Import logger to trigger initialization
      await import("../../src/utils/logger");

      // Directory should now exist
      expect(fs.existsSync(testLogDir)).toBe(true);
    });

    it("should not attempt to create directory if it already exists", async () => {
      // Change to temp directory
      process.chdir(tempDir);

      const testLogDir = path.join(process.cwd(), ".vantage");

      // Pre-create the directory
      fs.mkdirSync(testLogDir, { recursive: true });
      const statsBefore = fs.statSync(testLogDir);

      // Import logger
      await import("../../src/utils/logger");

      // Directory should still exist (no errors)
      const statsAfter = fs.statSync(testLogDir);
      expect(statsAfter.ino).toBe(statsBefore.ino); // Same inode
    });
  });

  describe("Logger initialization", () => {
    it("should initialize successfully when directory can be created", async () => {
      process.chdir(tempDir);

      const loggerModule = await import("../../src/utils/logger");

      expect(loggerModule.default).toBeDefined();
      expect(loggerModule.LogLevel).toBeDefined();
    });
  });

  describe("LogLevel enum", () => {
    it("should export all required log levels", async () => {
      process.chdir(tempDir);

      const { LogLevel } = await import("../../src/utils/logger");

      expect(LogLevel.ERROR).toBe("error");
      expect(LogLevel.WARN).toBe("warn");
      expect(LogLevel.INFO).toBe("info");
      expect(LogLevel.DEBUG).toBe("debug");
    });
  });

  describe("Logger methods", () => {
    it("should provide all logging methods", async () => {
      process.chdir(tempDir);

      const logger = (await import("../../src/utils/logger")).default;

      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.debug).toBe("function");

      // These should not throw
      expect(() => logger.error("test error")).not.toThrow();
      expect(() => logger.warn("test warning")).not.toThrow();
      expect(() => logger.info("test info")).not.toThrow();
      expect(() => logger.debug("test debug")).not.toThrow();
    });
  });
});
