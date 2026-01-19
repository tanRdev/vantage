import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";
import "../types/window";

export interface Metric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
}

export interface WebVitalsData {
  lcp?: number;
  inp?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  timestamp: number;
  url: string;
}

export interface WebVitalsConfig {
  reportUrl?: string;
  reportThreshold?: number;
}

export class WebVitalsCollector {
  private data: WebVitalsData;
  private config: WebVitalsConfig;

  constructor(config: WebVitalsConfig = {}) {
    this.data = {
      timestamp: Date.now(),
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    this.config = config;
  }

  collect(): void {
    if (typeof window === "undefined") {
      console.log("⚠️  Web Vitals collection requires browser environment");
      return;
    }

    onLCP((metric: Metric) => {
      this.data.lcp = metric.value;
      this.logMetric("LCP", metric.value, 2500);
      this.reportMetric("lcp", metric.value);
    });

    onINP((metric: Metric) => {
      this.data.inp = metric.value;
      this.logMetric("INP", metric.value, 200);
      this.reportMetric("inp", metric.value);
    });

    onCLS((metric: Metric) => {
      this.data.cls = metric.value;
      this.logMetric("CLS", metric.value, 0.1);
      this.reportMetric("cls", metric.value);
    });

    onFCP((metric: Metric) => {
      this.data.fcp = metric.value;
      this.logMetric("FCP", metric.value, 1800);
      this.reportMetric("fcp", metric.value);
    });

    onTTFB((metric: Metric) => {
      this.data.ttfb = metric.value;
      this.logMetric("TTFB", metric.value, 800);
      this.reportMetric("ttfb", metric.value);
    });
  }

  getData(): WebVitalsData {
    return this.data;
  }

  private logMetric(name: string, value: number, threshold: number): void {
    const status = value <= threshold ? "✅" : "❌";
    const unit = name === "CLS" ? "" : "ms";

    console.log(`  ${status} ${name}: ${value.toFixed(2)}${unit} (threshold: ${threshold}${unit})`);
  }

  private reportMetric(name: string, value: number): void {
    if (!this.config.reportUrl) {
      return;
    }

    const payload = {
      metric: name,
      value,
      timestamp: Date.now(),
      url: this.data.url,
    };

    if (typeof window !== "undefined") {
      window.fetch(this.config.reportUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).catch((error: Error) => {
        console.error(`Failed to report ${name}:`, error);
      });
    }
  }

  static generateInstrumentationCode(config: WebVitalsConfig = {}): string {
    return `
// Performance Enforcer - Web Vitals Instrumentation
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

onCLS((metric) => {
  console.log('CLS:', metric.value);
  ${config.reportUrl ? `
  fetch('${config.reportUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: 'cls',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    })
  });` : ''}
});

onLCP((metric) => {
  console.log('LCP:', metric.value);
  ${config.reportUrl ? `
  fetch('${config.reportUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: 'lcp',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    })
  });` : ''}
});

onINP((metric) => {
  console.log('INP:', metric.value);
  ${config.reportUrl ? `
  fetch('${config.reportUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: 'inp',
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    })
  });` : ''}
});
`;
  }
}
