export class PerformanceEnforcerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PerformanceEnforcerError";
  }
}

export class ConfigError extends PerformanceEnforcerError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class AnalysisError extends PerformanceEnforcerError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "AnalysisError";
  }
}

export class LighthouseError extends PerformanceEnforcerError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "LighthouseError";
  }
}

export class BundleError extends PerformanceEnforcerError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "BundleError";
  }
}

export class ValidationError extends PerformanceEnforcerError {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}
