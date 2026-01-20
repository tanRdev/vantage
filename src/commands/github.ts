import { Command, Flags } from "@oclif/core";
import { GitHubIntegration } from "../integrations/github.js";

export default class Github extends Command {
  static description = "GitHub integration commands for CI/CD";
  static summary = "Post comments and status checks to GitHub PRs";

  static flags = {
    "post-comment": Flags.boolean({
      description: "Post performance results as PR comment",
      default: false,
    }),
    "set-status": Flags.boolean({
      description: "Set commit status check",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Github);

    const token = process.env.GITHUB_TOKEN;
    const repository = process.env.GITHUB_REPOSITORY;
    const prNumber = process.env.GITHUB_PR_NUMBER;
    const sha = process.env.GITHUB_SHA;

    if (!token || !repository) {
      this.error("Missing GITHUB_TOKEN or GITHUB_REPOSITORY environment variables");
    }

    const github = new GitHubIntegration(token, repository);

    if (flags["post-comment"]) {
      if (!prNumber) {
        this.error("Missing GITHUB_PR_NUMBER environment variable");
      }
      await github.postComment(parseInt(prNumber, 10));
    }

    if (flags["set-status"]) {
      if (!sha) {
        this.error("Missing GITHUB_SHA environment variable");
      }
      await github.setStatus(sha);
    }

    if (!flags["post-comment"] && !flags["set-status"]) {
      this.error("Please specify --post-comment or --set-status");
    }
  }
}
