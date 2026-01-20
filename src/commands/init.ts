import { Command } from "@oclif/core";
import type * as FS from "fs";

export default class Init extends Command {
  static description = "Initialize vantage configuration";
  static id = "init";

  async run(): Promise<void> {
    console.log("Initializing vantage...");

    const args = process.argv.slice(2);
    const forceFlag = args.includes("--force") || args.includes("-f");

    console.log("\n📝 Creating .vantage.yml...");

    const config = {
      framework: "nextjs",
      bundle: {
        analysis: "deep",
        outputDir: ".next",
        treemap: true,
        budgets: [
          {
            path: "app/**/*.js",
            max: "100kb",
          },
          {
            path: "chunks/main-*.js",
            max: "150kb",
          },
        ],
        thresholds: {
          regression: 10,
          warning: 5,
        },
        ignore: ["**/node_modules/**", "**/test/**"],
      },
      runtime: {
        routes: ["/", "/dashboard", "/checkout"],
        exclude: ["/api/**", "/_next/**"],
        thresholds: {
          lcp: 2500,
          inp: 200,
          cls: 0.1,
          tbt: 300,
        },
        lighthouse: {
          numberOfRuns: 3,
          preset: "desktop",
          throttling: "fast-3g",
        },
      },
    };

    const yamlContent = `# Vantage Configuration
framework: ${config.framework}

# Bundle Analysis Configuration
bundle:
  # Analysis depth: deep (module-level, treemaps) or simple (size only)
  analysis: deep

  # Next.js output directory
  outputDir: .next

  # Generate treemap visualizations
  treemap: true

  # Size budgets for specific paths
  budgets:
    - path: "app/**/*.js"
      max: 100kb
    - path: "chunks/main-*.js"
      max: 150kb

  # Threshold percentages for regression detection
  thresholds:
    regression: 10    # Fail if bundle grows by more than 10%
    warning: 5        # Warn if bundle grows by 5-10%

  # Ignore patterns for bundle analysis
  ignore:
    - "**/node_modules/**"
    - "**/test/**"

# Runtime Performance Configuration
runtime:
  # Routes to test (required)
  routes:
    - /
    - /dashboard
    - /checkout

  # Routes to exclude from testing
  exclude:
    - "/api/**"
    - "/_next/**"

  # Thresholds for Core Web Vitals (in milliseconds)
  thresholds:
    lcp: 2500    # Largest Contentful Paint
    inp: 200      # Interaction to Next Paint
    cls: 0.1      # Cumulative Layout Shift
    tbt: 300      # Total Blocking Time

  # Lighthouse configuration
  lighthouse:
    numberOfRuns: 3           # Number of runs for averaging
    preset: desktop            # desktop or mobile
    throttling: fast-3g        # fast-3g, slow-4g, or offline
`;

    try {
      const fs = await import("fs");
      const fsModule = fs as typeof FS;

      if (fsModule.existsSync(".vantage.yml") && !forceFlag) {
        console.log("\n⚠️  Config file already exists. Use --force to overwrite.");
        return;
      }

      fsModule.writeFileSync(".vantage.yml", yamlContent, "utf-8");
      console.log("✅ Configuration created successfully!");
      console.log("\nNext steps:");
      console.log("  1. Review .vantage.yml");
      console.log("  2. Run: vantage check");
      console.log("  3. Run: vantage bundle analyze");
    } catch (error) {
      console.error("❌ Failed to create config file:", error);
      process.exit(1);
    }
  }
}
