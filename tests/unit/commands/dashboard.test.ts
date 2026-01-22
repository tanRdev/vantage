import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as path from "path";

// We will create a separate utility module for path validation
// This test file will import that module
import { validateDashboardPath } from "../../../src/utils/path-validator";

describe("validateDashboardPath", () => {
  describe("path validation", () => {
    it("should reject paths containing shell command injection characters", () => {
      // Paths with command injection attempts
      const maliciousPaths = [
        "../../../etc/passwd",
        "/etc/passwd",
        "dashboard; rm -rf /",
        "dashboard && malicious",
        "dashboard | malicious",
        "dashboard `malicious`",
        "dashboard $(malicious)",
        "dashboard; malicious",
        "dashboard & malicious",
        "dashboard > /etc/passwd",
        "dashboard < /etc/passwd",
        "../../malicious",
        "../dashboard",
      ];

      maliciousPaths.forEach((maliciousPath) => {
        const result = validateDashboardPath(maliciousPath);
        expect(result, `Path "${maliciousPath}" should be rejected`).toBe(false);
      });
    });

    it("should accept valid relative dashboard paths", () => {
      const validPaths = [
        "dashboard",
        "./dashboard",
        "dashboard/",
        "./dashboard/",
      ];

      validPaths.forEach((validPath) => {
        const result = validateDashboardPath(validPath);
        expect(result, `Path "${validPath}" should be accepted`).toBe(true);
      });
    });

    it("should reject absolute paths", () => {
      const projectRoot = process.cwd();
      const absolutePaths = [
        path.join(projectRoot, "dashboard"),
        path.join(projectRoot, "some", "path", "to", "dashboard"),
        "/etc/passwd",
        "/var/log",
        "C:\\Windows\\System32",
      ];

      absolutePaths.forEach((absolutePath) => {
        const result = validateDashboardPath(absolutePath);
        expect(result, `Path "${absolutePath}" should be rejected`).toBe(false);
      });
    });

    it("should reject paths with null bytes", () => {
      expect(validateDashboardPath("dashboard\x00")).toBe(false);
      expect(validateDashboardPath("\x00dashboard")).toBe(false);
    });

    it("should reject empty paths", () => {
      expect(validateDashboardPath("")).toBe(false);
    });

    it("should normalize and validate paths with .. segments that escape target", () => {
      // Paths that escape the intended directory
      expect(validateDashboardPath("dashboard/../../etc")).toBe(false);
      expect(validateDashboardPath("dashboard/../malicious")).toBe(false);
      expect(validateDashboardPath("./dashboard/../../../etc/passwd")).toBe(false);
    });

    it("should reject paths with special shell characters", () => {
      const dangerousPaths = [
        "dashboard$HOME",
        "dashboard;cat /etc/passwd",
        "dashboard`whoami`",
        "dashboard\\x00malicious",
        "dashboard\\nmalicious",
        "dashboard\\rmalicious",
      ];

      dangerousPaths.forEach((dangerousPath) => {
        const result = validateDashboardPath(dangerousPath);
        expect(result, `Path "${dangerousPath}" should be rejected`).toBe(false);
      });
    });
  });
});
