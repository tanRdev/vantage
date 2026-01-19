import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";

declare const window: any;

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
      url: typeof (globalThis as any).window !== "undefined" ? (globalThis as any).window.location.href : "",
    };
    this.config = config;
  }

  collect(): void {
    if (typeof (globalThis as any).window === "undefined") {
      console.log("⚠️  Web Vitals collection requires browser environment");
      return;
    }

    (globalThis as any).onLCP((metric: any) => {
      this.data.lcp = metric.value;
      this.logMetric("LCP", metric.value, 2500);
      this.reportMetric("lcp", metric.value);
    });

    (globalThis as any).onINP((metric: any) => {
      this.data.inp = metric.value;
      this.logMetric("INP", metric.value, 200);
      this.reportMetric("inp", metric.value);
    });

    (globalThis as any).onCLS((metric: any) => {
      this.data.cls = metric.value;
      this.logMetric("CLS", metric.value, 0.1);
      this.reportMetric("cls", metric.value);
    });

    (globalThis as any).onFCP((metric: any) => {
      this.data.fcp = metric.value;
      this.logMetric("FCP", metric.value, 1800);
      this.reportMetric("fcp", metric.value);
    });

    (globalThis as any).onTTFB((metric: any) => {
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

    fetch(this.config.reportUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.error(`Failed to report ${name}:`, error);
    });
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
