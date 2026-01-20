import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextjsParser } from "../../src/analyzers/bundle/nextjs";
import * as fs from "fs";

vi.mock("fs");

describe("NextjsParser", () => {
  let parser: NextjsParser;

  beforeEach(() => {
    parser = new NextjsParser("/test/project");
    vi.clearAllMocks();
  });

  describe("detectNextjs", () => {
    it("should return null when package.json does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const result = parser.detectNextjs();
      expect(result).toBeNull();
    });

    it("should return null when Next.js is not in dependencies", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
        name: "test-project",
        dependencies: {
          react: "^18.0.0",
        },
      }));

      const result = parser.detectNextjs();
      expect(result).toBeNull();
    });

    it("should detect Next.js version", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
        name: "test-project",
        dependencies: {
          next: "^14.0.0",
        },
      }));

      const result = parser.detectNextjs();
      expect(result).not.toBeNull();
      expect(result?.version).toBe("14.0.0");
    });

    it("should detect Next.js version from devDependencies", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
        name: "test-project",
        devDependencies: {
          next: "15.0.0",
        },
      }));

      const result = parser.detectNextjs();
      expect(result).not.toBeNull();
      expect(result?.version).toBe("15.0.0");
    });

    it("should detect App router type", () => {
      vi.spyOn(fs, "existsSync").mockImplementation((path: string) => {
        if (typeof path === "string" && path.endsWith("package.json")) return true;
        if (typeof path === "string" && path.endsWith("app")) return true;
        return false;
      });
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
        name: "test-project",
        dependencies: { next: "^14.0.0" },
      }));

      const result = parser.detectNextjs();
      expect(result?.routerType).toBe("app");
    });

    it("should detect Pages router type", () => {
      vi.spyOn(fs, "existsSync").mockImplementation((path: string) => {
        if (typeof path === "string" && path.endsWith("package.json")) return true;
        if (typeof path === "string" && path.endsWith("pages")) return true;
        return false;
      });
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
        name: "test-project",
        dependencies: { next: "^14.0.0" },
      }));

      const result = parser.detectNextjs();
      expect(result?.routerType).toBe("pages");
    });
  });

  describe("getRoutes", () => {
    it("should return empty array when manifest does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const routes = parser.getRoutes();
      expect(routes).toEqual([]);
    });

    it("should parse routes from manifest", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(JSON.stringify({
        pages: {
          "/": "pages/index.html",
          "/about": "pages/about.html",
          "/blog/[id]": "pages/blog/[id].html",
        },
      }));

      const routes = parser.getRoutes();
      expect(routes).toContain("/");
      expect(routes).toContain("/about");
      expect(routes).toContain("/blog/[id]");
    });
  });

  describe("getChunks", () => {
    it("should return empty array when output dir does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const chunks = parser.getChunks("/nonexistent");
      expect(chunks).toEqual([]);
    });

    it("should list all JavaScript chunks", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readdirSync").mockReturnValue([
        { name: "main.js", isFile: () => true },
        { name: "vendor.js", isFile: () => true },
        { name: "readme.md", isFile: () => true },
        { name: "pages-manifest.json", isFile: () => true },
      ] as any);
      vi.spyOn(fs, "statSync").mockReturnValue({ size: 1024 } as any);

      const chunks = parser.getChunks("/test/output");
      expect(chunks.length).toBe(2);
      expect(chunks[0].name).toBe("main.js");
      expect(chunks[1].name).toBe("vendor.js");
    });
  });
});
