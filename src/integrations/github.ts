import { Octokit } from "octokit";
import * as fs from "fs";
import { formatMs, formatBytes } from "../utils/formatters.js";

export interface PerformanceResults {
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

export interface GitHubCommentResult {
  id: number;
  html_url: string;
}

export interface GitHubStatusCheckResult {
  id: number;
  state: "success" | "failure" | "pending";
  description: string;
  context: string;
}

export class GitHubIntegration {
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
    const runId = Date.now();

    try {
      const result = await this.octokit.rest.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: prNumber,
        body: comment,
      });

      console.log(`Posted performance comment to PR #${prNumber}`);
      console.log(`Comment URL: ${result.data.html_url}`);
    } catch (error: unknown) {
      console.error("Failed to post comment:", error instanceof Error ? error.message : String(error));
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
      console.error("Failed to update comment:", error instanceof Error ? error.message : String(error));
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

    let state: "success" | "failure" = "success";
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
        sha,
        state,
        description,
        context: "performance-enforcer",
      });

      console.log(`Set status check: ${state} - ${description}`);
    } catch (error: unknown) {
      console.error("Failed to set status check:", error instanceof Error ? error.message : String(error));
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

      const botComment = comments.find((comment: any) =>
        comment.user?.type === "Bot" &&
        comment.body?.includes("## Performance Results")
      );

      return botComment?.id || null;
    } catch (error) {
      console.error("Failed to find existing comment:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  private generateComment(results: PerformanceResults): string {
    let comment = "## Performance Results\n\n";

    if (results.runtime) {
      comment += "### Runtime Metrics\n\n";
      comment += "| Metric | Value | Status |\n";
      comment += "|--------|-------|--------|\n";

      if (results.runtime.lcp !== undefined) {
        const status = this.getMetricStatus(results.runtime.lcp, 2500);
        comment += `| LCP | ${formatMs(results.runtime.lcp)} | ${status} |\n`;
      }

      if (results.runtime.inp !== undefined) {
        const status = this.getMetricStatus(results.runtime.inp, 200);
        comment += `| INP | ${formatMs(results.runtime.inp)} | ${status} |\n`;
      }

      if (results.runtime.cls !== undefined) {
        const status = this.getMetricStatus(results.runtime.cls, 0.1);
        comment += `| CLS | ${results.runtime.cls.toFixed(3)} | ${status} |\n`;
      }

      if (results.runtime.score !== undefined) {
        const score = results.runtime.score;
        const status = score >= 90 ? "PASS" : score >= 80 ? "WARN" : "FAIL";
        comment += `| Score | ${score} | ${status} |\n`;
      }

      comment += "\n";
    }

    if (results.bundleSize) {
      comment += "### Bundle Analysis\n\n";
      comment += "| Metric | Value |\n";
      comment += "|--------|--------|\n";

      const delta = results.bundleSize.delta;

      const deltaFormatted = delta > 0 ? `+${formatBytes(delta)}` : formatBytes(delta);
      const deltaStatus = delta > 0 ? "INCREASE" : "DECREASE";

      comment += `| Size | ${formatBytes(results.bundleSize.current)} |\n`;
      comment += `| Change | ${deltaFormatted} ${deltaStatus} |\n`;
      comment += `| Status | ${results.bundleSize.status === "pass" ? "PASS" : results.bundleSize.status === "warn" ? "WARN" : "FAIL"} |\n`;

      comment += "\n";
    }

    comment += "---\n\n";
    comment += "*Generated by Performance Enforcer*";

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
    if (value <= threshold) return "PASS";
    if (value <= threshold * 1.1) return "WARN";
    return "FAIL";
  }
}
