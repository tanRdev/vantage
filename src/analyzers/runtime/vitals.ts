import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";
import type { Metric } from "../../types/window.js";
import "../types/window";
import Reporter from "../../core/reporter.js";

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
  debug?: boolean;
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
      Reporter.warn("Web Vitals collection requires browser environment");
      return;
    }

    onLCP((metric: Metric) => {
      this.data.lcp = metric.value;
      if (this.config.debug) {
        this.logMetric("LCP", metric.value, 2500);
      }
      this.reportMetric("lcp", metric.value);
    });

    onINP((metric: Metric) => {
      this.data.inp = metric.value;
      if (this.config.debug) {
        this.logMetric("INP", metric.value, 200);
      }
      this.reportMetric("inp", metric.value);
    });

    onCLS((metric: Metric) => {
      this.data.cls = metric.value;
      if (this.config.debug) {
        this.logMetric("CLS", metric.value, 0.1);
      }
      this.reportMetric("cls", metric.value);
    });

    onFCP((metric: Metric) => {
      this.data.fcp = metric.value;
      if (this.config.debug) {
        this.logMetric("FCP", metric.value, 1800);
      }
      this.reportMetric("fcp", metric.value);
    });

    onTTFB((metric: Metric) => {
      this.data.ttfb = metric.value;
      if (this.config.debug) {
        this.logMetric("TTFB", metric.value, 800);
      }
      this.reportMetric("ttfb", metric.value);
    });
  }

  getData(): WebVitalsData {
    return this.data;
  }

  private logMetric(name: string, value: number, threshold: number): void {
    const status = value <= threshold ? "PASS" : "FAIL";
    const unit = name === "CLS" ? "" : "ms";
    Reporter.info(`${status} ${name}: ${value.toFixed(2)}${unit} (threshold: ${threshold}${unit})`);
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
        keepalive: true,
      }).catch((error: Error) => {
        Reporter.error(`Failed to report ${name}`, error);
      });
    }
  }

  static generateInstrumentationCode(config: WebVitalsConfig = {}): string {
    return `
// Vantage - Web Vitals Instrumentation
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

const reportMetric = (metric, name) => {
  ${config.reportUrl ? `
  fetch('${config.reportUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: name,
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href
    }),
    keepalive: true
  }).catch(err => console.error('Failed to report metric:', err));
  ` : `
  // TODO: Send metric to your analytics endpoint
  console.log(\`\${name}:\`, metric.value);
  `}
};

onCLS((metric) => reportMetric(metric, 'cls'));
onLCP((metric) => reportMetric(metric, 'lcp'));
onINP((metric) => reportMetric(metric, 'inp'));
onFCP((metric) => reportMetric(metric, 'fcp'));
onTTFB((metric) => reportMetric(metric, 'ttfb'));
`;
  }
}
