// Bundle size thresholds (in bytes)
export const BUNDLE_SIZE_WARNING_THRESHOLD = 500 * 1024; // 500KB

// Treemap color thresholds (in bytes)
export const SIZE_THRESHOLD_SMALL = 100 * 1024;   // 100KB - Green
export const SIZE_THRESHOLD_MEDIUM = 500 * 1024;  // 500KB - Blue
export const SIZE_THRESHOLD_LARGE = 1024 * 1024;  // 1MB - Orange

// Treemap colors
export const COLOR_SMALL = "#4CAF50";
export const COLOR_MEDIUM = "#2196F3";
export const COLOR_LARGE = "#FF9800";
export const COLOR_XLARGE = "#F44336";

// Config thresholds
export const DEFAULT_REGRESSION_THRESHOLD = 10; // percent
export const DEFAULT_WARNING_THRESHOLD = 5;     // percent

// Performance score threshold
export const PERFORMANCE_SCORE_PASS_THRESHOLD = 90;

// Lighthouse defaults
export const DEFAULT_LIGHTHOUSE_RUNS = 3;
export const DEFAULT_LIGHTHOUSE_PRESET = "desktop" as const;
export const DEFAULT_THROTTLING = "fast-3g" as const;

// Config file
export const CONFIG_FILE = ".vantage.yml";
export const OUTPUT_DIR = ".vantage";

// Metric formatting precision (decimal places)
export const METRIC_PRECISION_LCP = 0;       // LCP displayed as whole milliseconds
export const METRIC_PRECISION_INP = 0;       // INP displayed as whole milliseconds
export const METRIC_PRECISION_CLS = 3;       // CLS displayed to 3 decimal places
export const METRIC_PRECISION_TBT = 0;       // TBT displayed as whole milliseconds
export const METRIC_PRECISION_FCP = 0;       // FCP displayed as whole milliseconds
export const METRIC_PRECISION_TTFB = 0;      // TTFB displayed as whole milliseconds
export const METRIC_PRECISION_SCORE = 0;     // Score displayed as whole number
export const METRIC_PRECISION_PERCENTAGE = 1; // Percentages displayed to 1 decimal place
