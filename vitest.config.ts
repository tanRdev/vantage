import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    root: "./",
    testTimeout: 10000,
    setupFiles: [],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs"],
    alias: {
      "@": resolve(__dirname, "./dist"),
      "~": resolve(__dirname, "./dist"),
      "../../src": resolve(__dirname, "./dist"),
    },
  },
});
