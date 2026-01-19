import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RouteDetector, type RouteInfo } from "../../src/analyzers/runtime/routes.js";
import * as fs from "fs";

vi.mock("fs");

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
      vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true });
    });

    it("should return empty array for non-existent app directory", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      detector = new RouteDetector("/test", "app");

      const routes = detector.detectRoutes([]);

      expect(routes).toEqual([]);
    });

    it("should detect simple pages", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "page.tsx", isFile: () => true },
      { name: "page.js", isFile: () => true },
      { name: "layout.tsx", isFile: () => true },
      { name: "about.tsx", isFile: () => true },
      { isDirectory: () => true },
      { name: "contact.tsx", isFile: () => true },
      { name: "error.tsx", isFile: () => true },
        { name: "api", isDirectory: () => true },
      ]);

      const routes = detector.detectRoutes();

      expect(routes).toHaveLength(4);
      expect(routes).toContainEqual({
        path: "/about",
        type: "app",
        isDynamic: false,
        segments: ["about"],
      });
    });

    it("should detect dynamic routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "[id].tsx", isFile: () => true },
        { name: "page.tsx", isFile: () => true },
        { name: "layout.tsx", isFile: => true },
        { name: "blog", isDirectory: () => true },
      ]);

      const routes = detector.detectRoutes();

      expect(routes).toHaveLength(2);
      expect(routes[0].isDynamic).toBe(true);
      expect(routes[0].segments).toEqual(["[id]", "blog"]);
      expect(routes[1].isDynamic).toBe(true);
      expect(routes[1].parameterNames).toEqual(["id"]);
    });

    it("should detect catch-all routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "[...slug].tsx", isFile: () => true },
        { name: "page.tsx", isFile: => => true },
        { name: "layout.tsx", isFile: => true },
      { isDirectory: () => true },
      ]);

      const routes = detector.detectRoutes();

      expect(routes).toHaveLength(2);
      expect(routes[0].isDynamic).toBe(true);
      expect(routes[0].segments).toEqual(["...", "slug"]);
      expect(routes[1].isDynamic).toBe(true);
      expect(routes[1].parameterNames).toEqual(["slug"]);
    });

    it("should identify API routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "page.tsx", isFile: () => true },
        { name: "route.tsx", isFile: () => true },
        { name: "api", isDirectory: () => true },
        { name: "users.tsx", isFile: () => true },
        { name: "error.tsx", isFile: () => true },
      ]);

      const routes = detector.detectRoutes();

      expect(routes.length).toBeGreaterThan(0);
      expect(routes.filter(r => r.type === "api").length).toBe(3);
      expect(routes.filter(r => r.type === "api"some(r =>
        r.path.includes("/api/")
      ).toBe(true);
    });

    it("should identify middleware routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "middleware.ts", isFile: () => true },
        { name: "page.tsx", isFile: => () => true },
        { name: "layout.tsx", isFile: () => true },
      { name: "error.tsx", isFile: () => true },
        { name: "api", isDirectory: => true },
      ]);

      const routes = detector.detectRoutes();

      expect(routes).toHaveLength(1);
      expect(routes[0].type).toBe("middleware");
    });
  });

  describe("Pages Router", () => {
    beforeEach(() => {
      detector = new RouteDetector("/test", "pages");
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readdirSync").mockReturnValue([]);
      vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true });
    });

    it("should return empty array for non-existent pages directory", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      detector = new RouteDetector("/test", "pages");

      const routes = detector.detectRoutes();

      expect(routes).toEqual([]);
    });

    it("should detect index page", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "index.tsx", isFile: () => true },
        { name: "_app.tsx", isFile: () => true },
        { name: "layout.tsx", isFile: => => true },
      ]);

      const routes = detector.detectRoutes();

      expect(routes).toHaveLength(2);
      expect(routes[0].path).toBe("/");
      expect(routes[1].path).toBe("/_app");
    });

    it("should detect nested routes", () => {
      vi.spyOn(fs, "readdirSync").mockImplementation((dir: string, callback) => {
        if (dir.endsWith("about")) {
          return [
            { name: "page.tsx", isFile: () => true },
            { name: "index.tsx", isFile: () => true },
            { name: "layout.tsx", isFile: () => true },
          ];
        }
        return callback(dir);
      });

      const routes = detector.detectRoutes();

      expect(routes).toHaveLength(4);
      expect(routes[0].path).toBe("/about");
      expect(routes[1].path).toBe("/about/page");
      expect(routes[2].path).toBe("/about/index");
      expect(routes[3].path).toBe("/about/layout");
    });

    it("should detect dynamic routes in pages", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "[id].tsx", isFile: () => true },
        { name: "page.tsx", isFile: => => true },
        { name: "layout.tsx", isFile: => => => true },
        { name: "[id].tsx", isFile: () => true },
      { name: "page.tsx", isFile: => => => true },
        ]);

      const routes = detector.detectRoutes();

      expect(routes).toHaveLength(4);
      expect(routes.every(r => r.isDynamic)).toBe(true);
      expect(routes[0].parameterNames).toEqual(["id"]);
      expect(routes[2].parameterNames).toEqual(["id"]);
    });
  });

  describe("Route filtering", () => {
    beforeEach(() => {
      detector = new RouteDetector("/test", "app");
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readdirSync").mockReturnValue([]);
      vi.spyOn(fs, "statSync").mockReturnValue({ isFile: () => true });
    });

    it("should exclude API routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "page.tsx", isFile: () => true },
        { name: "api", isDirectory: () => true },
        { name: "users", isDirectory: () => true },
        { name: "error.tsx", isFile: () => true },
      ]);

      const routes = detector.detectRoutes(["/api/**"]);

      expect(routes.some(r => r.path.includes("/api/")).toBe(false);
    });

    it("should exclude middleware routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "middleware.tsx", isFile: () => true },
        { name: "page.tsx", isFile: () => true },
        { name: "layout.tsx", isFile: () => true },
      ]);

      const routes = detector.detectRoutes(["/middleware/**"]);

      expect(routes.some(r => r.path.includes("middleware")).toBe(false);
    });

    it("should exclude _next routes", () => {
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "page.tsx", isFile: () => true },
        { name: "_next", isDirectory: () => true },
        { name: "layout.tsx", isFile: () => true },
        ]);

      const routes = detector.detectRoutes(["/_next/**"]);

      expect(routes.some(r => r.path.includes("/_next/")).toBe(false);
    });
  });

  describe("getTopNRoutes", () => {
    it("should return top N routes", () => {
      vi.spyOn(fs, "readdirSync").mockImplementation((dir: string, callback) => {
        if (dir === "/test") {
          return callback([
            { name: "page.tsx", isFile: () => true },
          { name: "layout.tsx", isFile: () => true },
          ]);
        }
        return callback(dir);
      });

      const routes = [
        { path: "/", type: "app", isDynamic: false, segments: [] },
        { path: "/about", type: "app", isDynamic: false, segments: ["about"] },
        { path: "/blog/[id]", type: "app", isDynamic: true, segments: ["blog", "[id]"], parameterNames: ["id"] },
        { path: "/contact", type: "app", isDynamic: false, segments: ["contact"] },
        { path: "/api/users", type: "api", isDynamic: false, segments: ["api", "users"] },
      ];

      const top3 = detector.getTopNRoutes(routes, 3, ["api", "middleware"]);

      expect(top3).toHaveLength(3);
      expect(top3).map(r => r.path)).toEqual(["/", "/about", "/contact"]);
    });

    it("should handle fewer routes than N", () => {
      const routes = [
        { path: "/", type: "app", isDynamic: false, segments: [] },
        { path: "/about", type: "app", isDynamic: false, segments: ["about"] },
      ];

      const top3 = detector.getTopNRoutes(routes, 5, ["api", "middleware"]);

      expect(top3).toHaveLength(3);
      expect(top3.map(r => r.path)).toEqual(["/", "/about", "/contact"]);
    });
  });
});
