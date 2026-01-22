import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BundleAnalyzer, type Chunk } from "../../src/analyzers/bundle/analyzer";

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

describe("BundleAnalyzer", () => {
  let analyzer: BundleAnalyzer;
  let mockChunks: Chunk[];

  beforeEach(() => {
    analyzer = new BundleAnalyzer();
    mockChunks = [
      {
        id: "main.js",
        name: "main.js",
        size: 1024 * 100,
        files: ["main.js"],
        modules: ["react", "lodash", "app"],
      },
      {
        id: "vendor.js",
        name: "vendor.js",
        size: 1024 * 200,
        files: ["vendor.js"],
        modules: ["react-dom", "react"],
      },
      {
        id: "utils.js",
        name: "utils.js",
        size: 1024 * 50,
        files: ["utils.js"],
        modules: ["helper"],
      },
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeChunks", () => {
    it("should calculate total size correctly", () => {
      const analysis = analyzer.analyzeChunks(mockChunks);
      expect(analysis.totalSize).toBe(1024 * 350);
    });

    it("should count chunks correctly", () => {
      const analysis = analyzer.analyzeChunks(mockChunks);
      expect(analysis.chunkCount).toBe(3);
    });

    it("should count total modules correctly", () => {
      const analysis = analyzer.analyzeChunks(mockChunks);
      expect(analysis.totalModules).toBe(5);
    });

    it("should detect duplicate modules", () => {
      const analysis = analyzer.analyzeChunks(mockChunks);
      expect(analysis.duplicateModules).toBe(1);
      expect(analysis.largestModules.some(m => m.name === "react" && m.isDuplicate)).toBe(true);
    });

    it("should identify largest modules", () => {
      // Use chunks with actual module sizes for deterministic ordering
      const chunksWithSizes: Chunk[] = [
        {
          id: "main.js",
          name: "main.js",
          size: 1024 * 100,
          files: ["main.js"],
          modules: ["react", "lodash", "app"],
          moduleSizes: {
            "react": 1024 * 10,
            "lodash": 1024 * 5,
            "app": 1024 * 85,
          },
        },
        {
          id: "vendor.js",
          name: "vendor.js",
          size: 1024 * 200,
          files: ["vendor.js"],
          modules: ["react-dom", "react"],
          moduleSizes: {
            "react-dom": 1024 * 150,
            "react": 1024 * 50,
          },
        },
        {
          id: "utils.js",
          name: "utils.js",
          size: 1024 * 50,
          files: ["utils.js"],
          modules: ["helper"],
          moduleSizes: {
            "helper": 1024 * 50,
          },
        },
      ];
      const analysis = analyzer.analyzeChunks(chunksWithSizes);
      expect(analysis.largestModules.length).toBeGreaterThan(0);
      expect(analysis.largestModules[0].name).toBe("react-dom");
    });

    it("should use actual module sizes when provided, not even distribution", () => {
      // Chunk with 100KB total size
      // With even distribution: each module would be 33.33KB
      // With actual sizes: 60KB, 30KB, 10KB
      const chunkWithSizes: Chunk[] = [
        {
          id: "main.js",
          name: "main.js",
          size: 1024 * 100,
          files: ["main.js"],
          modules: ["large-lib", "medium-lib", "small-lib"],
          moduleSizes: {
            "large-lib": 1024 * 60,
            "medium-lib": 1024 * 30,
            "small-lib": 1024 * 10,
          },
        },
      ];

      const analysis = analyzer.analyzeChunks(chunkWithSizes);

      // Find the module sizes in the result
      const largeLib = analysis.modules.find(m => m.name === "large-lib");
      const mediumLib = analysis.modules.find(m => m.name === "medium-lib");
      const smallLib = analysis.modules.find(m => m.name === "small-lib");

      // Should use actual sizes, NOT even distribution (100/3 = 33.33KB)
      expect(largeLib?.size).toBe(1024 * 60);
      expect(mediumLib?.size).toBe(1024 * 30);
      expect(smallLib?.size).toBe(1024 * 10);

      // Total should still match chunk size
      expect(analysis.modules.reduce((sum, m) => sum + m.size, 0)).toBe(1024 * 100);
    });

    it("should fall back to 0 size when module sizes not available", () => {
      // Chunk without moduleSizes - should not make up sizes
      const chunkWithoutSizes: Chunk[] = [
        {
          id: "main.js",
          name: "main.js",
          size: 1024 * 100,
          files: ["main.js"],
          modules: ["lib-a", "lib-b"],
        },
      ];

      const analysis = analyzer.analyzeChunks(chunkWithoutSizes);

      // When actual module sizes aren't available, modules should have 0 size
      // rather than incorrectly distributing chunk size evenly
      const libA = analysis.modules.find(m => m.name === "lib-a");
      const libB = analysis.modules.find(m => m.name === "lib-b");

      expect(libA?.size).toBe(0);
      expect(libB?.size).toBe(0);
    });
  });

  describe("compareBundles", () => {
    it("should detect added chunks", () => {
      const currentChunks = [...mockChunks, {
        id: "new.js",
        name: "new.js",
        size: 1024 * 10,
        files: ["new.js"],
      }];

      const diff = analyzer.compareBundles(currentChunks, mockChunks);

      expect(diff.addedChunks.length).toBe(1);
      expect(diff.addedChunks[0].id).toBe("new.js");
    });

    it("should detect removed chunks", () => {
      const previousChunks = [...mockChunks, {
        id: "removed.js",
        name: "removed.js",
        size: 1024 * 10,
        files: ["removed.js"],
      }];

      const diff = analyzer.compareBundles(mockChunks, previousChunks);

      expect(diff.removedChunks.length).toBe(1);
      expect(diff.removedChunks[0].id).toBe("removed.js");
    });

    it("should detect modified chunks", () => {
      const currentChunks = mockChunks.map(chunk =>
        chunk.id === "main.js"
          ? { ...chunk, size: 1024 * 150 }
          : chunk
      );

      const diff = analyzer.compareBundles(currentChunks, mockChunks);

      expect(diff.modifiedChunks.length).toBe(1);
      expect(diff.modifiedChunks[0].chunk.id).toBe("main.js");
      expect(diff.modifiedChunks[0].sizeDelta).toBe(1024 * 50);
    });

    it("should calculate total size change correctly", () => {
      const currentChunks = mockChunks.map(chunk =>
        chunk.id === "main.js"
          ? { ...chunk, size: 1024 * 150 }
          : chunk
      );

      const diff = analyzer.compareBundles(currentChunks, mockChunks);

      expect(diff.totalSizeChange).toBe(1024 * 50);
    });
  });

  describe("checkBudget", () => {
    it("should check budget for matching chunks", () => {
      const budgets = [
        { path: "main.js", max: "150kb" },
        { path: "vendor.js", max: "100kb" },
      ];

      const results = analyzer.checkBudget(mockChunks, budgets);

      expect(results.length).toBe(2);
      expect(results[0].exceeds).toBe(false);
      expect(results[1].exceeds).toBe(true);
      expect(results[1].currentSize).toBe(1024 * 200);
    });

    it("should handle non-matching paths", () => {
      const budgets = [
        { path: "nonexistent.js", max: "100kb" },
      ];

      const results = analyzer.checkBudget(mockChunks, budgets);

      expect(results.length).toBe(1);
      expect(results[0].currentSize).toBe(0);
      expect(results[0].exceeds).toBe(false);
    });
  });

  describe("generateTreemapData", () => {
    it("should generate valid treemap structure", () => {
      const treemapData = analyzer.generateTreemapData(mockChunks);

      expect(treemapData).toHaveProperty("name");
      expect(treemapData).toHaveProperty("value");
      expect(treemapData).toHaveProperty("children");
      expect(treemapData.children?.length).toBe(3);
      expect(treemapData.value).toBe(1024 * 350);
    });

    it("should maintain chunk hierarchy", () => {
      const treemapData = analyzer.generateTreemapData(mockChunks);

      expect(treemapData.children?.[0].name).toBe("main.js");
      expect(treemapData.children?.[0].value).toBe(1024 * 100);
    });
  });
});
