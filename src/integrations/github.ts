import { Octokit } from "octokit";
import * as fs from "fs";

interface PerformanceResults {
  bundleSize?: {
    current: number;
    previous: number;
    delta: number;
    status: "pass" | "warn" | "fail";
  };
  runtime?: {
    lcp?: number;
    inp?: number;
    cls?: number;
    score?: number;
    status: "pass" | "warn" | "fail";
  };
  timestamp: number;
}

interface GitHubCommentResult {
  id: number;
  body: string;
  html_url: string;
}

interface GitHubStatusCheckResult {
  id: number;
  state: "pending" | "success" | "failure" | "error";
  description: string;
  context: string;
}

class GitHubIntegration {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private resultsPath: string;

  constructor(token: string, repository: string) {
    this.octokit = new Octokit({ auth: token });
    [this.owner, this.repo] = repository.split("/");
    this.resultsPath = ".performance-enforcer/results.json";
  }

  loadResults(): PerformanceResults | null {
    if (!fs.existsSync(this.resultsPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.resultsPath, "utf-8");
      return JSON.parse(content) as PerformanceResults;
    } catch (error) {
      console.error("Failed to load results:", error);
      return null;
    }
  }

  async postComment(prNumber: number): Promise<void> {
    const results = this.loadResults();

    if (!results) {
      console.log("No performance results found. Skipping comment.");
      return;
    }

    const comment = this.generateComment(results);

    try {
      const result = await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        body: comment,
      });

      console.log(`Posted performance comment to PR #${prNumber}`);
      console.log(`  Comment URL: ${result.data.html_url}`);
    } catch (error: unknown) {
      console.error("Failed to post comment:", error);
    }
  }

  async updateComment(prNumber: number): Promise<void> {
    const commentId = await this.findExistingComment(prNumber);

    if (!commentId) {
      await this.postComment(prNumber);
      return;
    }

    const results = this.loadResults();

    if (!results) {
      return;
    }

    const comment = this.generateComment(results);

    try {
      await this.octokit.rest.issues.updateComment({
        owner: this.owner,
        repo: this.repo,
        comment_id: commentId,
        body: comment,
      });

      console.log(`Updated performance comment on PR #${prNumber}`);
    } catch (error: unknown) {
      console.error("Failed to update comment:", error);
    }
  }

  async setStatus(sha: string): Promise<void> {
    const results = this.loadResults();

    if (!results) {
      console.log("No performance results found. Skipping status check.");
      return;
    }

    const hasFailures = this.hasFailures(results);
    const hasWarnings = this.hasWarnings(results);

    let state: "success" | "failure" | "error" = "success";
    let description = "All performance checks passed";

    if (hasFailures) {
      state = "failure";
      description = "Performance thresholds exceeded";
    } else if (hasWarnings) {
      state = "success";
      description = "Performance checks passed with warnings";
    }

    try {
      await this.octokit.rest.repos.createCommitStatus({
        owner: this.owner,
        repo: this.repo,
        sha: sha,
        state,
        description,
        context: "performance-enforcer",
      });

      console.log(`Set status check: ${state} - ${description}`);
    } catch (error: unknown) {
      console.error("Failed to set status check:", error);
    }
  }

  async findExistingComment(prNumber: number): Promise<number | null> {
    try {
      const { data: comments } = await this.octokit.rest.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        per_page: 100,
      });

      const botComment = comments.find((comment: GitHubCommentResult) =>
        comment.user?.type === "Bot" &&
        comment.body?.includes("## Performance Results")
      );

      return botComment?.id || null;
    } catch (error: unknown) {
      console.error("Failed to find existing comment:", error);
      return null;
    }
  }

  private generateComment(results: PerformanceResults): string {
    let comment = "## Performance Results\n\n";

    if (results.runtime) {
      comment += "### Runtime Metrics\n\n";
      comment += `| Metric | Value | Status |\n`;
      comment += `|--------|-------|--------|\n`;

      if (results.runtime.lcp) {
        const status = this.getMetricStatus(results.runtime.lcp, 2500);
        comment += `| LCP | ${this.formatMs(results.runtime.lcp)} | ${status} |\n`;
      }

      if (results.runtime.inp) {
        const status = this.getMetricStatus(results.runtime.inp, 200);
        comment += `| INP | ${this.formatMs(results.runtime.inp)} | ${status} |\n`;
      }

      if (results.runtime.cls) {
        const status = this.getMetricStatus(results.runtime.cls, 0.1);
        comment += `| CLS | ${results.runtime.cls.toFixed(3)} | ${status} |\n`;
      }

      if (results.runtime.score) {
        const score = results.runtime.score;
        const status = score >= 90 ? "✅" : score >= 80 ? "⚠️" : "❌";
        comment += `| Score | ${score} | ${status} |\n`;
      }

      comment += "\n";
    }

    if (results.bundleSize) {
      comment += "### Bundle Analysis\n\n";
      comment += `| Metric | Value |\n`;
      comment += `|--------|-------|\n`;

      const delta = results.bundleSize.delta;
      const deltaFormatted = delta > 0 ? `+${this.formatBytes(delta)}` : this.formatBytes(delta);
      const deltaStatus = delta > 0 ? "📈" : "📉";

      comment += `| Size | ${this.formatBytes(results.bundleSize.current)} |\n`;
      comment += `| Change | ${deltaFormatted} ${deltaStatus} |\n`;
      comment += `| Status | ${results.bundleSize.status === "pass" ? "✅" : results.bundleSize.status === "warn" ? "⚠️" : "❌"} |\n`;

      comment += "\n";
    }

    comment += "---\n\n";
    comment += `*Generated by Performance Enforcer*`;

    return comment;
  }

  private hasFailures(results: PerformanceResults): boolean {
    return (
      (results.runtime?.status === "fail") ||
      (results.bundleSize?.status === "fail")
    );
  }

  private hasWarnings(results: PerformanceResults): boolean {
    return (
      (results.runtime?.status === "warn") ||
      (results.bundleSize?.status === "warn")
    );
  }

  private getMetricStatus(value: number, threshold: number): string {
    if (value <= threshold) return "✅";
    if (value <= threshold * 1.1) return "⚠️";
    return "❌";
  }

  private formatMs(value: number): string {
    return `${value.toFixed(0)}ms`;
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command !== "post-comment" && command !== "set-status") {
    console.log("Usage: node github.js [post-comment|set-status]");
    process.exit(1);
  }

  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.GITHUB_PR_NUMBER;
  const sha = process.env.GITHUB_SHA;

  if (!token || !repository) {
    console.error("GITHUB_TOKEN and GITHUB_REPOSITORY must be set");
    process.exit(1);
  }

  const integration = new GitHubIntegration(token, repository);

  try {
    if (command === "post-comment") {
      if (!prNumber) {
        console.error("GITHUB_PR_NUMBER must be set for post-comment");
        process.exit(1);
      }

      await integration.postComment(parseInt(prNumber, 10));
    } else if (command === "set-status") {
      if (!sha) {
        console.error("GITHUB_SHA must be set for set-status");
        process.exit(1);
      }

      await integration.setStatus(sha);
    }
  } catch (error: unknown) {
    console.error("Failed to execute command:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
