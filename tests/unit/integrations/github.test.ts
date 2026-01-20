import { describe, it, expect, vi, beforeEach } from "vitest";
import { Octokit } from "octokit";
import * as fs from "fs";

import { GitHubIntegration } from "../../src/integrations/github";

vi.mock("octokit", () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    rest: {
      issues: {
        createComment: vi.fn().mockResolvedValue({
          data: { html_url: "https://github.com/mock/comment" },
        }),
        updateComment: vi.fn().mockResolvedValue({ data: { id: 123 } }),
        listComments: vi.fn().mockResolvedValue({ data: [] }),
      },
      repos: {
        createCommitStatus: vi.fn().mockResolvedValue({ data: {} }),
      },
    },
  })),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => "{}"),
}));

// Helper to get the mocked fs functions
function getFsMocks() {
  return {
    existsSync: vi.mocked(fs).existsSync,
    readFileSync: vi.mocked(fs).readFileSync,
  };
}

describe("GitHubIntegration", () => {
  let integration: GitHubIntegration;

  const mockToken = "ghp_test_token";
  const mockRepository = "owner/repo";

  beforeEach(() => {
    // Reset all mocks
    const mocks = getFsMocks();
    mocks.existsSync.mockReset();
    mocks.readFileSync.mockReset();
    mocks.existsSync.mockReturnValue(false);
    mocks.readFileSync.mockReturnValue("{}");

    integration = new GitHubIntegration(mockToken, mockRepository);
  });

  describe("loadResults", () => {
    it("should return null when results file does not exist", () => {
      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(false);

      const results = integration.loadResults();

      expect(results).toBeNull();
    });

    it("should parse and return results when file exists", () => {
      const mockData = {
        runtime: {
          lcp: 1200,
          inp: 45,
          cls: 0.05,
          score: 92,
          status: "pass" as const,
        },
        timestamp: Date.now(),
      };

      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(true);
      mocks.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const results = integration.loadResults();

      expect(results).not.toBeNull();
      expect(results?.runtime?.lcp).toBe(1200);
      expect(results?.runtime?.inp).toBe(45);
      expect(results?.runtime?.cls).toBe(0.05);
      expect(results?.runtime?.score).toBe(92);
      expect(results?.runtime?.status).toBe("pass");
    });

    it("should return null on parse error", () => {
      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(true);
      mocks.readFileSync.mockImplementation(() => {
        throw new Error("Parse error");
      });

      const results = integration.loadResults();

      expect(results).toBeNull();
    });
  });

  describe("postComment", () => {
    it("should skip posting when no results found", () => {
      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(false);

      integration.postComment(1);

      expect(integration["octokit"].rest.issues.createComment).not.toHaveBeenCalled();
    });

    it("should create formatted comment with runtime metrics", async () => {
      const mockData = {
        runtime: {
          lcp: 1200,
          inp: 45,
          cls: 0.05,
          score: 92,
          status: "pass" as const,
        },
      };

      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(true);
      mocks.readFileSync.mockReturnValue(JSON.stringify(mockData));

      await integration.postComment(1);

      expect(integration["octokit"].rest.issues.createComment).toHaveBeenCalled();
    });
  });

  describe("setStatus", () => {
    it("should set success status when all checks pass", async () => {
      const mockData = {
        runtime: {
          lcp: 1200,
          inp: 45,
          cls: 0.05,
          status: "pass" as const,
        },
      };

      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(true);
      mocks.readFileSync.mockReturnValue(JSON.stringify(mockData));

      await integration.setStatus("abc123");

      expect(integration["octokit"].rest.repos.createCommitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "owner",
          repo: "repo",
          sha: "abc123",
          state: "success",
          context: "vantage",
        })
      );
    });

    it("should set failure status when thresholds exceeded", async () => {
      const mockData = {
        bundleSize: {
          current: 300 * 1024,
          status: "fail" as const,
        },
      };

      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(true);
      mocks.readFileSync.mockReturnValue(JSON.stringify(mockData));

      await integration.setStatus("abc123");

      expect(integration["octokit"].rest.repos.createCommitStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          state: "failure",
          context: "vantage",
        })
      );
    });

    it("should skip when no results found", async () => {
      const mocks = getFsMocks();
      mocks.existsSync.mockReturnValue(false);

      await integration.setStatus("abc123");

      expect(integration["octokit"].rest.repos.createCommitStatus).not.toHaveBeenCalled();
    });
  });

  describe("findExistingComment", () => {
    it("should find bot comment", async () => {
      const botComment = {
        id: 123,
        user: {
          type: "Bot",
        },
        body: "## Performance Results\n\nAll checks passed",
      };

      (integration["octokit"].rest.issues.listComments as any).mockResolvedValue({
        data: [botComment],
      });

      const commentId = await integration.findExistingComment(1);

      expect(commentId).toBe(123);
    });

    it("should return null when no bot comment exists", async () => {
      (integration["octokit"].rest.issues.listComments as any).mockResolvedValue({
        data: [],
      });

      const commentId = await integration.findExistingComment(1);

      expect(commentId).toBeNull();
    });

    it("should return null on API error", async () => {
      (integration["octokit"].rest.issues.listComments as any).mockRejectedValue(new Error("API error"));

      const commentId = await integration.findExistingComment(1);

      expect(commentId).toBeNull();
    });
  });

  describe("updateComment", () => {
    it("should post new comment if none exists", async () => {
      (integration["octokit"].rest.issues.listComments as any).mockResolvedValue({
        data: [],
      });

      await integration.updateComment(1);

      expect(integration["octokit"].rest.issues.updateComment).not.toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      (integration["octokit"].rest.issues.listComments as any).mockRejectedValue(new Error("API error"));

      await integration.updateComment(1);
    });
  });
});
