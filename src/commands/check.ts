import { Command } from "@oclif/core";
import Reporter from "../core/reporter.js";
import { NextjsParser } from "../analyzers/bundle/nextjs.js";
import { RuntimeChecker } from "../services/RuntimeChecker.js";
import { BundleChecker } from "../services/BundleChecker.js";
import { CheckFailedError } from "../core/errors.js";

export default class Check extends Command {
  static description = "Run all configured performance checks";
  static id = "check";
  static allowArbitraryFlags = false;
  static strict = false;

  async run(): Promise<void> {
    Reporter.info("Running vantage checks...");
    Reporter.info("Loading configuration...");

    let hasFailures = false;

    try {
      const { loadConfig } = await import("../core/config.js");
      const config = await loadConfig();

      Reporter.info(`Configuration loaded. Framework: ${config.framework}`);

      const nextjsInfo = new NextjsParser(process.cwd()).detectNextjs();

      if (config.runtime && nextjsInfo) {
        Reporter.info("Running runtime metrics...");

        try {
          const runtimeChecker = new RuntimeChecker(process.cwd(), nextjsInfo, config.runtime);
          await runtimeChecker.check();
        } catch (error) {
          if (error instanceof CheckFailedError) {
            hasFailures = true;
          } else {
            throw error;
          }
        }
      } else if (config.runtime) {
        Reporter.warn("Could not detect Next.js project. Skipping runtime checks.");
      }

      Reporter.info("Running bundle analysis...");

      try {
        const bundleChecker = new BundleChecker(process.cwd(), config.bundle);
        bundleChecker.check();
      } catch (error) {
        if (error instanceof CheckFailedError) {
          hasFailures = true;
        } else {
          throw error;
        }
      }

    } catch (error) {
      Reporter.error("Failed to run checks", error as Error);
      process.exit(1);
    }

    if (hasFailures) {
      process.exit(1);
    }

    Reporter.success("All checks completed!");
  }
}
