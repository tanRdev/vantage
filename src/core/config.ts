import * as fs from "fs";
import * as path from "path";
import yaml from "yaml";
import { z } from "zod";

export interface BundleBudget {
  path: string;
  max: string;
}

export interface RuntimeThresholds {
  lcp?: number;
  inp?: number;
  cls?: number;
  tbt?: number;
  fcp?: number;
}

export interface LighthouseConfig {
  numberOfRuns?: number;
  preset?: "desktop" | "mobile";
  throttling?: "fast-3g" | "slow-4g" | "offline";
}

export interface RuntimeConfig {
  routes: string[];
  exclude?: string[];
  thresholds: RuntimeThresholds;
  lighthouse?: LighthouseConfig;
}

export interface BundleConfig {
  analysis: "deep" | "simple";
  outputDir: string;
  treemap: boolean;
  budgets: BundleBudget[];
  thresholds: {
    regression: number;
    warning: number;
  };
  ignore?: string[];
}

export interface PerformanceEnforcerConfig {
  framework: "nextjs" | "auto";
  bundle: BundleConfig;
  runtime?: RuntimeConfig;
}

const BundleBudgetSchema = z.object({
  path: z.string(),
  max: z.string(),
});

const RuntimeThresholdsSchema = z.object({
  lcp: z.number().optional(),
  inp: z.number().optional(),
  cls: z.number().optional(),
  tbt: z.number().optional(),
  fcp: z.number().optional(),
});

const LighthouseConfigSchema = z.object({
  numberOfRuns: z.number().min(1).max(10).default(3).optional(),
  preset: z.enum(["desktop", "mobile"]).default("desktop").optional(),
  throttling: z.enum(["fast-3g", "slow-4g", "offline"]).default("fast-3g").optional(),
});

const RuntimeConfigSchema = z.object({
  routes: z.array(z.string()).min(1),
  exclude: z.array(z.string()).optional(),
  thresholds: RuntimeThresholdsSchema,
  lighthouse: LighthouseConfigSchema.optional(),
});

const BundleConfigSchema = z.object({
  analysis: z.enum(["deep", "simple"]).default("deep"),
  outputDir: z.string().default(".next"),
  treemap: z.boolean().default(true),
  budgets: z.array(BundleBudgetSchema).default([]),
  thresholds: z.object({
    regression: z.number().min(0).max(100).default(10),
    warning: z.number().min(0).max(100).default(5),
  }),
  ignore: z.array(z.string()).default([]),
});

const ConfigSchema = z.object({
  framework: z.enum(["nextjs", "auto"]).default("auto"),
  bundle: BundleConfigSchema,
  runtime: RuntimeConfigSchema.optional(),
});

const DEFAULT_CONFIG: PerformanceEnforcerConfig = {
  framework: "nextjs",
  bundle: {
    analysis: "deep",
    outputDir: ".next",
    treemap: true,
    budgets: [],
    thresholds: {
      regression: 10,
      warning: 5,
    },
    ignore: [],
  },
};

const CONFIG_FILE = ".performance-enforcer.yml";

export async function loadConfig(
  configPath: string = CONFIG_FILE
): Promise<PerformanceEnforcerConfig> {
  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const configContent = fs.readFileSync(configPath, "utf-8");
    const parsed = yaml.parse(configContent);
    return ConfigSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Config validation error: ${error.errors.map(e => e.message).join(", ")}`);
    }
    throw new Error(`Failed to load config: ${error}`);
  }
}

export async function saveConfig(
  config: PerformanceEnforcerConfig,
  configPath: string = CONFIG_FILE
): Promise<void> {
  const configContent = yaml.stringify(config, {
    indent: 2,
    lineWidth: -1,
  });
  fs.writeFileSync(configPath, configContent, "utf-8");
}

export async function createDefaultConfig(
  configPath: string = CONFIG_FILE
): Promise<void> {
  if (fs.existsSync(configPath)) {
    console.log(`Config file already exists: ${configPath}`);
    return;
  }

  await saveConfig(DEFAULT_CONFIG, configPath);
  console.log(`Created default config file: ${configPath}`);
}

export function resolveConfigPath(cwd: string = process.cwd()): string {
  return path.resolve(cwd, CONFIG_FILE);
}
