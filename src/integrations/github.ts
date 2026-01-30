import { Octokit } from "octokit";
import * as fs from "fs";
import { formatMs, formatBytes } from "../utils/formatters.js";
import Reporter from "../core/reporter.js";

function validateGitHubToken(token: string): void {
  if (!token || typeof token !== "string") {
    throw new Error("GITHUB_TOKEN must be a non-empty string");
  }

  const trimmedToken = token.trim();
  if (trimmedToken.length < 36) {
    throw new Error("GITHUB_TOKEN appears to be invalid (too short)");
  }

  if (
    trimmedToken === "YOUR_TOKEN_HERE" ||
    trimmedToken === "YOUR_GITHUB_TOKEN"
  ) {
    throw new Error("GITHUB_TOKEN appears to be a placeholder value");
  }
}

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

export function shouldRetryOnRateLimit(
  error: Error & { status?: number },
): boolean {
  if (error.status === 403 || error.status === 429) {
    return true;
  }
  const errorMessage = error.message.toLowerCase();
  if (
    errorMessage.startsWith("rate limit") ||
    errorMessage.startsWith("too many requests")
  ) {
    return true;
  }
  return false;
}

export function calculateBackoffDelay(attempt: number): number {
  const baseDelay = 1000;
  const maxDelay = 60000;
  const jitter = Math.random() * 0.3 + 0.85;
  const delay = baseDelay * Math.pow(2, attempt - 1) * jitter;
  return Math.min(delay, maxDelay);
}

export interface RetryOptions {
  maxRetries?: number;
  onRetry?: (attempt: number, error: Error) => void;
  delayFn?: (attempt: number) => number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const delayFn = options.delayFn ?? calculateBackoffDelay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const err = error as Error & { status?: number };
      if (!shouldRetryOnRateLimit(err) || attempt > maxRetries) {
        throw error;
      }
      if (options.onRetry) {
        options.onRetry(attempt, err);
      }
      const delay = delayFn(attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unexpected error in retry loop");
}

export interface GitHubRetryOptions {
  maxRetries?: number;
  delayMs?: number;
}

const defaultRetryOptions: GitHubRetryOptions = {
  maxRetries: 3,
  delayMs: 500,
};

export class GitHubIntegration {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private resultsPath: string;
  private retryOptions: GitHubRetryOptions;

  constructor(
    token: string,
    repository: string,
    options?: { retry?: Partial<GitHubRetryOptions> },
  ) {
    validateGitHubToken(token);
    validateRepository(repository);

    this.octokit = new Octokit({ auth: token });
    const parts = repository.split("/");
    this.owner = parts[0];
    this.repo = parts[1];
    this.resultsPath = ".vantage/results.json";
    this.retryOptions = {
      maxRetries: defaultRetryOptions.maxRetries,
      delayMs: defaultRetryOptions.delayMs,
      ...options?.retry,
    };
  }

  loadResults(): PerformanceResults | null {
    if (!fs.existsSync(this.resultsPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.resultsPath, "utf-8");
      return JSON.parse(content) as PerformanceResults;
    } catch (error) {
      Reporter.error(
        "Failed to load results",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  async postComment(prNumber: number): Promise<void> {
    const results = this.loadResults();

    if (!results) {
      Reporter.info("No performance results found. Skipping comment.");
      return;
    }

    const comment = this.generateComment(results);

    try {
      const result = await withRetry(
        () =>
          this.octokit.rest.issues.createComment({
            owner: this.owner,
            repo: this.repo,
            issue_number: prNumber,
            body: comment,
          }),
        {
          maxRetries: this.retryOptions.maxRetries,
          delayFn: () => this.retryOptions.delayMs ?? 500,
        },
      );

      Reporter.info(`Posted performance comment to PR #${prNumber}`);
      Reporter.info(`Comment URL: ${result.data.html_url}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Reporter.error(`Failed to post comment: ${errorMessage}`);

      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        Reporter.error(
          "Authentication failed. Please check your GITHUB_TOKEN has appropriate permissions.",
        );
      }
      throw error;
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
      await withRetry(
        () =>
          this.octokit.rest.issues.updateComment({
            owner: this.owner,
            repo: this.repo,
            comment_id: commentId,
            body: comment,
          }),
        {
          maxRetries: this.retryOptions.maxRetries,
          delayFn: () => this.retryOptions.delayMs ?? 500,
        },
      );

      Reporter.info(`Updated performance comment on PR #${prNumber}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Reporter.error(`Failed to update comment: ${errorMessage}`);
      throw error;
    }
  }

  async setStatus(sha: string): Promise<void> {
    const results = this.loadResults();

    if (!results) {
      Reporter.info("No performance results found. Skipping status check.");
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
      await withRetry(
        () =>
          this.octokit.rest.repos.createCommitStatus({
            owner: this.owner,
            repo: this.repo,
            sha,
            state,
            description,
            context: "vantage",
          }),
        {
          maxRetries: this.retryOptions.maxRetries,
          delayFn: () => this.retryOptions.delayMs ?? 500,
        },
      );

      Reporter.info(`Set status check: ${state} - ${description}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Reporter.error(`Failed to set status check: ${errorMessage}`);
      throw error;
    }
  }

  async findExistingComment(prNumber: number): Promise<number | null> {
    try {
      let page = 1;
      const perPage = 100;

      while (true) {
        const response = await withRetry(
          () =>
            this.octokit.rest.issues.listComments({
              owner: this.owner,
              repo: this.repo,
              issue_number: prNumber,
              per_page: perPage,
              page,
            }),
          {
            maxRetries: this.retryOptions.maxRetries,
            delayFn: () => this.retryOptions.delayMs ?? 500,
          },
        );

        const comments = response.data;

        const botComment = comments.find((comment) => {
          const user = comment.user as { type?: string } | undefined;
          return (
            user?.type === "Bot" &&
            typeof comment.body === "string" &&
            comment.body.includes("## Performance Results")
          );
        });

        if (botComment) {
          return botComment.id;
        }

        if (comments.length < perPage) {
          break;
        }

        page++;
      }

      return null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Reporter.error(`Failed to find existing comment: ${errorMessage}`);
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

      const deltaFormatted =
        delta > 0 ? `+${formatBytes(delta)}` : formatBytes(delta);
      const deltaStatus = delta > 0 ? "INCREASE" : "DECREASE";

      comment += `| Size | ${formatBytes(results.bundleSize.current)} |\n`;
      comment += `| Change | ${deltaFormatted} ${deltaStatus} |\n`;
      comment += `| Status | ${results.bundleSize.status === "pass" ? "PASS" : results.bundleSize.status === "warn" ? "WARN" : "FAIL"} |\n`;

      comment += "\n";
    }

    comment += "---\n\n";
    comment += "*Generated by Vantage*";

    return comment;
  }

  private hasFailures(results: PerformanceResults): boolean {
    return (
      results.runtime?.status === "fail" ||
      results.bundleSize?.status === "fail"
    );
  }

  private hasWarnings(results: PerformanceResults): boolean {
    return (
      results.runtime?.status === "warn" ||
      results.bundleSize?.status === "warn"
    );
  }

  private getMetricStatus(value: number, threshold: number): string {
    if (value <= threshold) return "PASS";
    if (value <= threshold * 1.1) return "WARN";
    return "FAIL";
  }
}

function validateRepository(repository: string): void {
  if (!repository || typeof repository !== "string") {
    throw new Error("Repository must be a non-empty string");
  }

  const parts = repository.split("/");
  if (parts.length !== 2) {
    throw new Error("Repository must be in format 'owner/repo'");
  }

  if (!parts[0] || !parts[1]) {
    throw new Error("Repository owner and name cannot be empty");
  }
}
