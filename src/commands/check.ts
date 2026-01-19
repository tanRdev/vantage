import { Command } from "@oclif/core";
import Reporter from "../core/reporter.js";
import { NextjsParser, type NextjsInfo } from "../analyzers/bundle/nextjs.js";
import { RuntimeChecker } from "../services/RuntimeChecker.js";
import { BundleChecker } from "../services/BundleChecker.js";
import type { PerformanceEnforcerConfig } from "../core/config.js";

export default class Check extends Command {
  static description = "Run all configured performance checks";
  static id = "check";

  async run(): Promise<void> {
    console.log("Running performance-enforcer checks...");
    console.log("\n🔍 Loading configuration...");

    try {
      const { loadConfig } = await import("../core/config.js");
      const config = await loadConfig();

      console.log("✅ Configuration loaded");
      console.log(`\nFramework: ${config.framework}`);

      const nextjsInfo = new NextjsParser(process.cwd()).detectNextjs();

      if (config.runtime && nextjsInfo) {
        console.log(`\n📊 Running runtime metrics...`);
        const runtimeChecker = new RuntimeChecker(process.cwd(), nextjsInfo, config.runtime);
        await runtimeChecker.check();
      } else if (config.runtime) {
        Reporter.warn("Could not detect Next.js project. Skipping runtime checks.");
      }

      console.log("\n📦 Running bundle analysis...");

      const bundleChecker = new BundleChecker(process.cwd(), config.bundle);
      bundleChecker.check();

    } catch (error) {
      Reporter.error("Failed to run checks", error as Error);
      process.exit(1);
    }
  }
}
