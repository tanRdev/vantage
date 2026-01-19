import { describe, it, expect, vi, beforeEach, afterEach, beforeEach as beforeEachType } from "vitest";

import { GitHubIntegration } from "../../src/integrations/github";

vi.mock("octokit", () => ({
  Octokit: vi.fn(() => ({
    rest: {
      issues: {
        createComment: vi.fn(),
        updateComment: vi.fn(),
        listComments: vi.fn(),
      },
      repos: {
        createCommitStatus: vi.fn(),
      },
    }),
  }),
}));

describe("GitHubIntegration", () => {
  let integration: GitHubIntegration;

  const mockToken = "ghp_test_token";
  const mockRepository = "owner/repo";

  beforeEach(() => {
    integration = new GitHubIntegration(mockToken, mockRepository);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("loadResults", () => {
    beforeEach(() => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify({
          runtime: {
            lcp: 1200,
            inp: 45,
            cls: 0.05,
            score: 92,
            status: "pass",
          },
          timestamp: Date.now(),
        })
      );
    });

    it("should return null when results file does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);

      const results = integration.loadResults();

      expect(results).toBeNull();
    });

    it("should parse and return results when file exists", () => {
      const results = integration.loadResults();

      expect(results).not.toBeNull();
      expect(results?.runtime?.lcp).toBe(1200);
      expect(results?.runtime?.inp).toBe(45);
      expect(results?.runtime?.cls).toBe(0.05);
      expect(results?.runtime?.score).toBe(92);
      expect(results?.runtime?.status).toBe("pass");
      expect(results?.timestamp).toBeGreaterThan(Date.now() - 1000);
    });

    it("should return null on parse error", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
        throw new Error("Parse error");
      });

      const results = integration.loadResults();

      expect(results).toBeNull();
    });
  });

  describe("postComment", () => {
    it("should post comment to PR", async () => {
      const prNumber = 1;
      const expectedComment = "## Performance Results\n\nAll checks passed\n";

      integration.octokit.rest.issues.createComment.mockResolvedValue({
        data: {
          html_url: "https://github.com/mock/comment",
        },
      });

      await integration.postComment(prNumber);

      expect(
        integration.octokit.rest.issues.createComment
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "owner",
          repo: "repo",
          issue_number: prNumber,
          body: expect.stringContaining("Performance Results"),
        })
      );
    });

    it("should skip posting when no results found", async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      integration.octokit.rest.issues.createComment.mockClear();

      await integration.postComment(1);

      expect(console.log).toHaveBeenCalledWith("No performance results found. Skipping comment.");
    });

    it("should create formatted comment with runtime metrics", async () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify({
          runtime: {
            lcp: 1200,
            inp: 45,
            cls: 0.05,
            score: 92,
            status: "pass",
          },
        })
      );
      integration.octokit.rest.issues.createComment.mockClear();

      await integration.postComment(1);

      const comment = integration.octokit.rest.issues.createComment.mock.calls[0][0].body;

      expect(comment).toContain("### Runtime Metrics");
      expect(comment).toContain("LCP | 1200ms");
      expect(comment).toContain("INP | 45ms");
      expect(comment).toContain("CLS | 0.05");
      expect(comment).toContain("Score | 92");
      expect(comment).toContain("✅");
    });

    it("should create formatted comment with bundle analysis", async () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify({
          bundleSize: {
            current: 245 * 1024,
            previous: 230 * 1024,
            delta: 15 * 1024,
            status: "pass",
          },
        })
      );
      integration.octokit.rest.issues.createComment.mockClear();

      await integration.postComment(1);

      const comment = integration.octokit.rest.issues.createComment.mock.calls[0][0].body;

      expect(comment).toContain("### Bundle Analysis");
      expect(comment).toContain("Size | 245KB");
      expect(comment).toContain("Change | +15KB");
      expect(comment).toContain("✅");
    });
  });

  describe("setStatus", () => {
    it("should set success status when all checks pass", async () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify({
          runtime: {
            lcp: 1200,
            inp: 45,
            cls: 0.05,
            status: "pass",
          },
        })
      );
      integration.octokit.rest.repos.createCommitStatus.mockClear();

      await integration.setStatus("abc123");

      expect(
        integration.octokit.rest.repos.createCommitStatus
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "owner",
          repo: "repo",
          sha: "abc123",
          state: "success",
          description: "All performance checks passed",
          context: "performance-enforcer",
        })
      );
    });

    it("should set failure status when thresholds exceeded", async () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(
        JSON.stringify({
          bundleSize: {
            current: 300 * 1024,
            status: "fail",
          },
        })
      );
      integration.octokit.rest.repos.createCommitStatus.mockClear();

      await integration.setStatus("abc123");

      expect(
        integration.octokit.rest.repos.createCommitStatus
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "owner",
          repo: "repo",
          sha: "abc123",
          state: "failure",
          description: "Performance thresholds exceeded",
          context: "performance-enforcer",
        })
      );
    });

    it("should set pending status when no results found", async () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      integration.octokit.rest.repos.createCommitStatus.mockClear();

      await integration.setStatus("abc123");

      expect(console.log).toHaveBeenCalledWith("No performance results found. Skipping status check.");
      expect(integration.octokit.rest.repos.createCommitStatus).not.toHaveBeenCalled();
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

      integration.octokit.rest.issues.listComments.mockResolvedValue({
        data: [botComment],
      });

      const commentId = await integration.findExistingComment(1);

      expect(commentId).toBe(123);
    });

    it("should return null when no bot comment exists", async () => {
      integration.octokit.rest.issues.listComments.mockResolvedValue({
        data: [],
      });

      const commentId = await integration.findExistingComment(1);

      expect(commentId).toBeNull();
    });

    it("should return null on API error", async () => {
      integration.octokit.rest.issues.listComments.mockRejectedValue(new Error("API error"));

      const commentId = await integration.findExistingComment(1);

      expect(commentId).toBeNull();
    });
  });

  describe("updateComment", () => {
    it("should update existing comment", async () => {
      const existingComment = {
        id: 123,
        user: {
          type: "Bot",
        },
        body: "Old results",
      };

      integration.octokit.rest.issues.listComments.mockResolvedValue({
        data: [existingComment],
      });
      integration.octokit.rest.issues.updateComment.mockResolvedValue({
        data: { id: 123 },
      });

      await integration.updateComment(1);

      expect(
        integration.octokit.rest.issues.updateComment
      ).toHaveBeenCalledWith(
          expect.objectContaining({
            owner: "owner",
            repo: "repo",
            comment_id: 123,
          }),
        );
      });

      expect(console.log).toHaveBeenCalledWith("Updated performance comment on PR #1");
    });

    it("should post new comment if none exists", async () => {
      integration.octokit.rest.issues.listComments.mockResolvedValue({
        data: [],
      });

      await integration.updateComment(1);

      expect(integration.octokit.rest.issues.updateComment).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith("Posted performance comment to PR #1");
    });

    it("should return early on parse error", async () => {
      integration.octokit.rest.issues.listComments.mockRejectedValue(new Error("Parse error"));

      await integration.updateComment(1);

      expect(console.error).toHaveBeenCalledWith("Failed to update comment:");
    });
  });
});
