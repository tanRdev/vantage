import { describe, it, expect, vi, beforeEach } from "vitest";
import * as path from "path";
import * as fs from "fs";
import {
  TreemapGenerator,
  type TreemapNode,
} from "../../../src/analyzers/bundle/treemap";

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("TreemapGenerator", () => {
  const mockReadFileSync = vi.mocked(fs.readFileSync);
  const mockWriteFileSync = vi.mocked(fs.writeFileSync);
  const mockMkdirSync = vi.mocked(fs.mkdirSync);

  beforeEach(() => {
    mockReadFileSync.mockImplementation((filePath: fs.PathOrFileDescriptor) => {
      const resolvedPath = filePath.toString();
      if (resolvedPath.endsWith("treemap.html")) {
        return '<html><head><link rel="stylesheet" href="./treemap-styles.css"></head><body><script src="./treemap-script.js"></script></body></html>';
      }

      if (resolvedPath.endsWith("treemap-styles.css")) {
        return ".treemap { display: block; }";
      }

      return "";
    });
  });

  it("creates output directory before writing treemap", async () => {
    const generator = new TreemapGenerator();
    const data: TreemapNode = { name: "bundle", value: 123 };
    const outputPath = path.join(".vantage", "treemap.html");

    await generator.generateHTML(data, outputPath);

    expect(mockMkdirSync).toHaveBeenCalledWith(path.dirname(outputPath), {
      recursive: true,
    });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      outputPath,
      expect.any(String),
      "utf-8",
    );
  });
});
