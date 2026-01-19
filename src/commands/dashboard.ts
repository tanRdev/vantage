import { Command } from "@oclif/core";
import * as path from "path";
import * as fs from "fs";
import Reporter from "../core/reporter.js";

export default class Dashboard extends Command {
  static description = "Launch performance dashboard";
  static id = "dashboard";

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const deployFlag = args.includes("--deploy") || args.includes("-d");
    const portIndex = args.indexOf("--port") || args.indexOf("-p");
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000;

    if (deployFlag) {
      console.log("🚀 Deploying dashboard to GitHub Pages...");

      try {
        const { spawn } = await import("child_process");

        const build = spawn("npm", ["run", "build"], {
          cwd: "./dashboard",
          stdio: "inherit",
        });

        await new Promise((resolve) => build.on("close", resolve));

        console.log("\n✅ Dashboard ready for deployment");
        console.log("\nTo deploy to GitHub Pages:");
        console.log("  1. git add .");
        console.log("  2. git commit -m 'Update dashboard'");
        console.log("  3. git push origin main");
        console.log("\nThen enable GitHub Pages in repo settings");

        process.exit(0);
      } catch (error) {
        Reporter.error("Dashboard deployment failed", error as Error);
        process.exit(1);
      }
    } else {
      console.log(`🎨 Starting dashboard on port ${port}...`);
      console.log("\n📊 Opening dashboard at http://localhost:" + port + "\n");

      try {
        const { spawn } = await import("child_process");
        const dashboardPath = path.join(process.cwd(), "dashboard");

        if (!fs.existsSync(dashboardPath)) {
          Reporter.error("Dashboard directory not found. Run from project root.");
          process.exit(1);
        }

        const dev = spawn("npm", ["run", "dev"], {
          cwd: dashboardPath,
          stdio: "inherit",
        });

        dev.on("error", (error: Error) => {
          Reporter.error("Failed to start dashboard", error);
        });

        process.on("SIGINT", () => {
          console.log("\n\n🛑 Stopping dashboard...");
          dev.kill();
          process.exit(0);
        });

      } catch (error) {
        Reporter.error("Failed to start dashboard", error as Error);
        process.exit(1);
      }
    }
  }
}
