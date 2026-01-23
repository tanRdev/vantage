import { describe, expect, it, vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(() => false),
}));

vi.mock("os", () => ({
  homedir: () => "/tmp",
}));

describe("DashboardStorage bundle history", () => {
  it("normalizes bundle metrics to camelCase", async () => {
    const { getDashboardStorage } =
      await import("../../../dashboard/lib/storage");
    const storage = getDashboardStorage();
    const history = storage.getBundleHistory("main", 5);

    expect(history.length).toBeGreaterThan(0);
    history.forEach((record) => {
      expect(record.chunkName).toBeTruthy();
      expect(Number.isFinite(record.newSize)).toBe(true);
    });
  });
});
