import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BundleDiffView } from "@/components/charts/BundleDiffView";
import type { BundleDiff, Chunk } from "@/types/bundle";
import type { CheckRecord } from "@/types/api";
import { api } from "@/lib/api-client";

const mockChunk = (id: string, size: number): Chunk => ({
  id,
  name: id,
  size,
  files: [id],
  modules: [],
});

const mockBuilds: CheckRecord[] = [
  {
    id: 1,
    timestamp: Date.now() - 86400000,
    branch: "main",
    commit: "abc123",
    checkType: "bundle",
    status: "pass",
    duration: 1000,
  },
  {
    id: 2,
    timestamp: Date.now(),
    branch: "main",
    commit: "def456",
    checkType: "bundle",
    status: "pass",
    duration: 1200,
  },
];

const mockDiff: BundleDiff = {
  addedChunks: [mockChunk("new-chunk.js", 1024 * 50)],
  removedChunks: [mockChunk("removed-chunk.js", 1024 * 30)],
  modifiedChunks: [
    {
      chunk: mockChunk("main.js", 1024 * 150),
      oldSize: 1024 * 100,
      newSize: 1024 * 150,
      sizeDelta: 1024 * 50,
    },
  ],
  totalSizeChange: 1024 * 70,
};

vi.mock("@/lib/api-client", () => ({
  api: {
    getMetrics: vi.fn(),
    getBundles: vi.fn(),
    getRoutes: vi.fn(),
    getBuilds: vi.fn(() =>
      Promise.resolve({ success: true, data: mockBuilds }),
    ),
    getStats: vi.fn(),
    getBundleTrends: vi.fn(),
    getBundleDiff: vi.fn(() =>
      Promise.resolve({ success: true, data: mockDiff }),
    ),
  },
}));

describe("BundleDiffView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<BundleDiffView />);
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("should render build selectors after loading", async () => {
    render(<BundleDiffView />);
    await waitFor(() => {
      expect(screen.getByLabelText(/build a/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/build b/i)).toBeInTheDocument();
    });
  });

  it("should show diff data when builds are selected", async () => {
    render(<BundleDiffView />);

    await waitFor(() => {
      expect(screen.getByLabelText(/build a/i)).toBeInTheDocument();
    });

    const buildASelect = screen.getByLabelText(/build a/i);
    const buildBSelect = screen.getByLabelText(/build b/i);

    fireEvent.change(buildASelect, { target: { value: "1" } });
    fireEvent.change(buildBSelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.getByText(/new-chunk\.js/i)).toBeInTheDocument();
      expect(screen.getByText(/removed-chunk\.js/i)).toBeInTheDocument();
      expect(screen.getByText(/main\.js/i)).toBeInTheDocument();
    });
  });

  it("should display total size change", async () => {
    render(<BundleDiffView />);

    await waitFor(() => {
      expect(screen.getByLabelText(/build a/i)).toBeInTheDocument();
    });

    const buildASelect = screen.getByLabelText(/build a/i);
    const buildBSelect = screen.getByLabelText(/build b/i);

    fireEvent.change(buildASelect, { target: { value: "1" } });
    fireEvent.change(buildBSelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.getByText(/\+70\.0 kb/i)).toBeInTheDocument();
    });
  });

  it("should highlight added chunks in green", async () => {
    render(<BundleDiffView />);

    await waitFor(() => {
      expect(screen.getByLabelText(/build a/i)).toBeInTheDocument();
    });

    const buildASelect = screen.getByLabelText(/build a/i);
    const buildBSelect = screen.getByLabelText(/build b/i);

    fireEvent.change(buildASelect, { target: { value: "1" } });
    fireEvent.change(buildBSelect, { target: { value: "2" } });

    await waitFor(() => {
      const addedRow = screen.getByText(/new-chunk\.js/i).closest("div");
      expect(addedRow?.className).toContain("bg-status-success");
    });
  });

  it("should highlight removed chunks in red", async () => {
    render(<BundleDiffView />);

    await waitFor(() => {
      expect(screen.getByLabelText(/build a/i)).toBeInTheDocument();
    });

    const buildASelect = screen.getByLabelText(/build a/i);
    const buildBSelect = screen.getByLabelText(/build b/i);

    fireEvent.change(buildASelect, { target: { value: "1" } });
    fireEvent.change(buildBSelect, { target: { value: "2" } });

    await waitFor(() => {
      const removedRow = screen.getByText(/removed-chunk\.js/i).closest("div");
      expect(removedRow?.className).toContain("bg-status-critical");
    });
  });

  it("should handle empty diff state", async () => {
    vi.spyOn(api, "getBundleDiff").mockResolvedValue({
      success: true,
      data: {
        addedChunks: [],
        removedChunks: [],
        modifiedChunks: [],
        totalSizeChange: 0,
      },
    });

    render(<BundleDiffView />);

    await waitFor(() => {
      expect(screen.getByLabelText(/build a/i)).toBeInTheDocument();
    });

    const buildASelect = screen.getByLabelText(/build a/i);
    const buildBSelect = screen.getByLabelText(/build b/i);

    fireEvent.change(buildASelect, { target: { value: "1" } });
    fireEvent.change(buildBSelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(screen.getByText(/no changes/i)).toBeInTheDocument();
    });
  });

  it("should call API with correct build IDs", async () => {
    const getBundleDiffSpy = vi.spyOn(api, "getBundleDiff").mockResolvedValue({
      success: true,
      data: mockDiff,
    });

    render(<BundleDiffView />);

    await waitFor(() => {
      expect(screen.getByLabelText(/build a/i)).toBeInTheDocument();
    });

    const buildASelect = screen.getByLabelText(/build a/i);
    const buildBSelect = screen.getByLabelText(/build b/i);

    fireEvent.change(buildASelect, { target: { value: "1" } });
    fireEvent.change(buildBSelect, { target: { value: "2" } });

    await waitFor(() => {
      expect(getBundleDiffSpy).toHaveBeenCalledWith(1, 2);
    });
  });
});
