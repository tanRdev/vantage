export interface WindowWithWebVitals extends Window {
  onLCP?: (callback: (metric: Metric) => void) => void;
  onINP?: (callback: (metric: Metric) => void) => void;
  onCLS?: (callback: (metric: Metric) => void) => void;
  onFCP?: (callback: (metric: Metric) => void) => void;
  onTTFB?: (callback: (metric: Metric) => void) => void;
}

export interface Metric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
}

declare global {
  interface Window {
    performance: Performance;
  location: Location;
  addEventListener: any;
  removeEventListener: any;
  setTimeout: any;
  clearTimeout: any;
  setInterval: any;
  clearInterval: any;
    fetch: any;
  XMLHttpRequest: any;
  JSON: any;
  Date: DateConstructor;
    Math: Math;
    console: Console;
    document: Document;
    HTMLElement: typeof HTMLElement;
    HTMLElementTagNameMap: HTMLElementTagNameMap;
    navigator: Navigator;
  }
}

export {};
