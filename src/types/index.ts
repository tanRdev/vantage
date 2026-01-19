import type { BundleBudget, RuntimeThresholds, LighthouseConfig, RuntimeConfig, BundleConfig } from "../core/config.js";

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
  baseUrl?: string;
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

export interface LighthouseResult {
  url: string;
  score: number;
  lcp: number;
  inp?: number;
  cls: number;
  tbt: number;
  fcp: number;
  runs: number;
}

export interface NextjsInfo {
  version: string;
  routerType: "pages" | "app" | "both";
  outputDir: string;
  hasTurbopack: boolean;
}
