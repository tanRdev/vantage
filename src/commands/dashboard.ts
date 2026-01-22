import { Command } from "@oclif/core";
import * as path from "path";
import * as fs from "fs";
import type { ChildProcess } from "child_process";
import Reporter from "../core/reporter.js";
import { validateAndResolveDashboardPath } from "../utils/path-validator.js";

export default class Dashboard extends Command {
  static description = "Launch performance dashboard";
  static id = "dashboard";

  /**
   * Track the active SIGINT handler to prevent accumulation on restart.
   * Stored as a static property to persist across command invocations.
   */
  private static sigintHandler: (() => void) | null = null;
  private static dashboardProcess: ChildProcess | null = null;

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const deployFlag = args.includes("--deploy") || args.includes("-d");
    const portIndex = args.indexOf("--port") || args.indexOf("-p");
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

    if (deployFlag) {
      Reporter.info("Deploying dashboard to GitHub Pages...");

      try {
        // Validate the dashboard path before using it
        const validatedPath = validateAndResolveDashboardPath("dashboard");
        if (!validatedPath) {
          Reporter.error("Dashboard directory not found or invalid. Run from project root.");
          process.exit(1);
        }

        const { spawn } = await import("child_process");

        // Use shell: false with explicit arguments for security
        const build = spawn("npm", ["run", "build"], {
          cwd: validatedPath,
          stdio: "inherit",
          shell: false,
        });

        const exitCode = await new Promise<number>((resolve) => {
          build.on("close", (code) => resolve(code ?? 1));
        });

        if (exitCode !== 0) {
          throw new Error(`Dashboard build failed with exit code ${exitCode}`);
        }

        Reporter.success("Dashboard ready for deployment");
        Reporter.info("To deploy to GitHub Pages:");
        Reporter.info("  1. git add .");
        Reporter.info("  2. git commit -m 'Update dashboard'");
        Reporter.info("  3. git push origin main");
        Reporter.info("Then enable GitHub Pages in repo settings");

        process.exit(0);
      } catch (error) {
        Reporter.error("Dashboard deployment failed", error as Error);
        process.exit(1);
      }
    } else {
      Reporter.info(`Starting dashboard on port ${port}...`);
      Reporter.info("Opening dashboard at http://localhost:" + port);

      try {
        // Validate the dashboard path before using it
        const validatedPath = validateAndResolveDashboardPath("dashboard");
        if (!validatedPath) {
          Reporter.error("Dashboard directory not found or invalid. Run from project root.");
          process.exit(1);
        }

        // Verify package.json exists
        const packageJsonPath = path.join(validatedPath, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
          Reporter.error("Dashboard package.json not found. Is the dashboard properly set up?");
          process.exit(1);
        }

        const { spawn } = await import("child_process");

        // Use shell: false with explicit arguments for security
        const dev = spawn("npm", ["run", "dev"], {
          cwd: validatedPath,
          stdio: "inherit",
          shell: false,
        });

        // Store reference for cleanup
        Dashboard.dashboardProcess = dev;

        dev.on("error", (error: Error) => {
          Reporter.error("Failed to start dashboard", error);
          process.exit(1);
        });

        // Remove any existing handler to prevent accumulation on restart
        if (Dashboard.sigintHandler) {
          process.removeListener("SIGINT", Dashboard.sigintHandler);
        }

        // Create and register the new handler
        Dashboard.sigintHandler = () => {
          Reporter.info("Stopping dashboard...");
          dev.kill();
          Dashboard.dashboardProcess = null;
          Dashboard.sigintHandler = null;
          process.exit(0);
        };

        process.on("SIGINT", Dashboard.sigintHandler);

      } catch (error) {
        Reporter.error("Failed to start dashboard", error as Error);
        process.exit(1);
      }
    }
  }
}
