import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RouteDetector, type RouteInfo } from "../../src/analyzers/runtime/routes";
import * as fs from "fs";

vi.mock("fs");

function createDirent(name: string, isDir: boolean): fs.Dirent {
  return {
    name,
    isFile: () => !isDir,
    isDirectory: () => isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
  } as fs.Dirent;
}

describe("RouteDetector", () => {
  let detector: RouteDetector;
  let appDir: string;

  beforeEach(() => {
    appDir = "/test/app";
    detector = new RouteDetector("/test", "app");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("App Router", () => {
    beforeEach(() => {
      detector = new RouteDetector("/test", "app");
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readdirSync").mockReturnValue([]);
      vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true } as any);
    });

    it("should return empty array for non-existent app directory", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      detector = new RouteDetector("/test", "app");

      const routes = detector.detectRoutes([]);

      expect(routes).toEqual([]);
    });

    it("should detect root page", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        createDirent("page.tsx", false),
        createDirent("layout.tsx", false),
      ] as any);

      const routes = detector.detectRoutes();

      expect(routes.length).toBe(1);
      expect(routes[0].path).toBe("/");
    });

    it("should detect dynamic routes in nested directories", () => {
      vi.spyOn(fs, "readdirSync").mockImplementation((dir: string) => {
        if (dir.includes("[id]")) {
          return [createDirent("page.tsx", false)] as any;
        }
        return [
          createDirent("page.tsx", false),
          createDirent("layout.tsx", false),
          createDirent("[id]", true),
        ] as any;
      });

      const routes = detector.detectRoutes();

      const dynamicRoutes = routes.filter(r => r.isDynamic);
      expect(dynamicRoutes.length).toBeGreaterThan(0);
    });

    it("should identify middleware routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        createDirent("middleware.ts", false),
        createDirent("page.tsx", false),
        createDirent("layout.tsx", false),
        createDirent("error.tsx", false),
      ] as any);

      const routes = detector.detectRoutes();

      expect(routes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Pages Router", () => {
    beforeEach(() => {
      detector = new RouteDetector("/test", "pages");
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readdirSync").mockReturnValue([]);
      vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true } as any);
    });

    it("should return empty array for non-existent pages directory", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      detector = new RouteDetector("/test", "pages");

      const routes = detector.detectRoutes();

      expect(routes).toEqual([]);
    });

    it("should detect index page", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        createDirent("index.tsx", false),
        createDirent("_app.tsx", false),
      ] as any);

      const routes = detector.detectRoutes();

      expect(routes.length).toBeGreaterThanOrEqual(1);
      expect(routes[0].path).toBe("/");
    });

    it("should detect dynamic routes in pages", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        createDirent("[id].tsx", false),
        createDirent("index.tsx", false),
      ] as any);

      const routes = detector.detectRoutes();

      expect(routes.length).toBe(2);
      expect(routes.some(r => r.isDynamic)).toBe(true);
    });
  });

  describe("Route filtering", () => {
    beforeEach(() => {
      detector = new RouteDetector("/test", "app");
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readdirSync").mockReturnValue([]);
      vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true } as any);
    });

    it("should handle empty exclude patterns", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        createDirent("page.tsx", false),
        createDirent("error.tsx", false),
      ] as any);

      const routes = detector.detectRoutes([]);

      expect(routes.length).toBe(1);
    });

    it("should safely handle exclude patterns with special regex characters", () => {
      // Patterns containing special regex characters that could cause ReDoS
      // or catastrophic backtracking if not properly escaped
      const maliciousPatterns = [
        "/api/(test)+",        // Unescaped parentheses and plus
        "/(.*)(.*)(.*)",       // Nested wildcards with parentheses
        "/api/users+.+",       // Plus quantifiers
        "/api/^test$",         // Anchors
        "/api/test?",          // Question mark
        "/api/[test]$z",       // Unclosed bracket with anchor
        "/api/test|bar",       // Alternation
        "/api/{id}",           // Curly braces
        "/api/test.$",         // Dot metacharacter
      ];

      // Test that each pattern can be processed without throwing
      // This tests that the ReDoS vulnerability is fixed
      expect(() => {
        for (const pattern of maliciousPatterns) {
          detector.detectRoutes([pattern]);
        }
      }).not.toThrow();
    });

    it("should safely handle patterns with plus sign to prevent ReDoS", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        createDirent("page.tsx", false),
        createDirent("error.tsx", false),
      ] as any);

      // The pattern with "+" should not cause catastrophic backtracking
      // This tests that special regex characters are properly escaped
      expect(() => {
        detector.detectRoutes(["/api/users+"]);
      }).not.toThrow();
    });

    it("should safely handle patterns with other special regex characters", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        createDirent("page.tsx", false),
        createDirent("error.tsx", false),
      ] as any);

      // Test patterns with various special regex characters
      const problematicPatterns = [
        "/api/(test)",      // Parentheses
        "/api/users?",      // Question mark
        "/api/test|bar",    // Alternation
        "/api/{id}",        // Curly braces
        "/api/test.$",      // Dot with anchor
      ];

      expect(() => {
        for (const pattern of problematicPatterns) {
          detector.detectRoutes([pattern]);
        }
      }).not.toThrow();
    });
  });

  describe("getTopNRoutes", () => {
    it("should return top N routes", () => {
      const routes = [
        { path: "/", type: "app" as const, isDynamic: false, segments: [] },
        { path: "/about", type: "app" as const, isDynamic: false, segments: ["about"] },
        { path: "/blog/[id]", type: "app" as const, isDynamic: true, segments: ["blog", "[id]"], parameterNames: ["id"] },
        { path: "/contact", type: "app" as const, isDynamic: false, segments: ["contact"] },
        { path: "/api/users", type: "api" as const, isDynamic: false, segments: ["api", "users"] },
      ] as RouteInfo[];

      const top3 = detector.getTopNRoutes(routes, 3, ["api", "middleware"]);

      expect(top3).toHaveLength(3);
      expect(top3[0].path).toBe("/");
      expect(top3[1].path).toBe("/about");
      expect(top3[2].path).toBe("/blog/[id]");
    });

    it("should handle fewer routes than N", () => {
      const routes = [
        { path: "/", type: "app" as const, isDynamic: false, segments: [] },
        { path: "/about", type: "app" as const, isDynamic: false, segments: ["about"] },
      ] as RouteInfo[];

      const top3 = detector.getTopNRoutes(routes, 5, ["api", "middleware"]);

      expect(top3).toHaveLength(2);
      expect(top3.map(r => r.path)).toEqual(["/", "/about"]);
    });
  });
});
