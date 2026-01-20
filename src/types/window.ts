export interface Metric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
}

declare global {
  interface Window {
    onLCP?: (callback: (metric: Metric) => void) => void;
    onINP?: (callback: (metric: Metric) => void) => void;
    onCLS?: (callback: (metric: Metric) => void) => void;
    onFCP?: (callback: (metric: Metric) => void) => void;
    onTTFB?: (callback: (metric: Metric) => void) => void;
  }
}

export {};
