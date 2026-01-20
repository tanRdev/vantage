# Configuration Reference

Vantage uses YAML configuration files to define performance budgets and check settings.

## Config File Location

The tool looks for configuration in the following order:

1. `.vantage.yml` in project root
2. `.vantage.yaml` in project root
3. `vantage.yml` in project root
4. Default configuration

## Full Configuration Example

```yaml
# Framework: nextjs, react, vue, svelte
framework: nextjs

# Runtime performance checks
runtime:
  enabled: true
  # Largest Contentful Paint (ms)
  lcp: 2500
  # Interaction to Next Paint (ms)
  inp: 200
  # Cumulative Layout Shift
  cls: 0.1
  # First Contentful Paint (ms)
  fcp: 1800
  # Time to First Byte (ms)
  ttfb: 800
  # Lighthouse performance score (0-100)
  score: 90
  # Custom Lighthouse config
  lighthouseConfig: ./lighthouse-config.js

# Bundle size budgets
bundle:
  enabled: true
  budgets:
    # Single path pattern
    - path: "app/**/*.js"
      maxSize: 200000
      warnSize: 150000
      name: "App Bundle"

    # Multiple paths
    - path: ["pages/**/*.js", "pages/**/*.tsx"]
      maxSize: 150000

    # Specific files
    - path: "src/components/Header.{js,jsx,ts,tsx}"
      maxSize: 25000

    # Vendor chunks
    - path: "node_modules/**/*.{js,jsx}"
      maxSize: 300000
      name: "Vendor"

# Output settings
output:
  # Results directory
  dir: .vantage
  # JSON output file
  json: results.json
  # HTML report
  html: report.html

# Server settings (for runtime checks)
server:
  # Build command
  build: npm run build
  # Start command
  start: npm start
  # Port
  port: 3000
  # Wait timeout (ms)
  wait: 30000
```

## Configuration Options

### framework

The framework to use for analysis.

| Value | Description |
|-------|-------------|
| `nextjs` | Next.js App Router and Pages Router |
| `react` | React (CRA, Vite) |
| `vue` | Vue 3 with Vite |
| `svelte` | SvelteKit |

### runtime

Runtime performance checks using Lighthouse CI.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable runtime checks |
| `lcp` | number | `2500` | LCP threshold in milliseconds |
| `inp` | number | `200` | INP threshold in milliseconds |
| `cls` | number | `0.1` | CLS threshold |
| `fcp` | number | `1800` | FCP threshold in milliseconds |
| `ttfb` | number | `800` | TTFB threshold in milliseconds |
| `score` | number | `90` | Lighthouse score (0-100) |
| `lighthouseConfig` | string | - | Path to custom Lighthouse config |

### bundle

Bundle size budgets for JavaScript/CSS chunks.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable bundle checks |
| `budgets` | array | `[]` | List of budget rules |

#### Budget Rules

Each budget rule supports:

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `path` | string\|string[] | Yes | Glob pattern(s) for files |
| `maxSize` | number | No | Maximum size in bytes (fail threshold) |
| `warnSize` | number | No | Warning size in bytes |
| `name` | string | No | Display name for the budget |

### output

Output file configuration.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dir` | string | `.vantage` | Output directory |
| `json` | string | `results.json` | JSON results file |
| `html` | string | `report.html` | HTML report file |

### server

Server configuration for runtime checks.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `build` | string | `npm run build` | Build command |
| `start` | string | `npm start` | Start command |
| `port` | number | `3000` | Server port |
| `wait` | number | `30000` | Startup wait time (ms) |

## Path Patterns

Bundle budgets use glob patterns for matching files:

- `**/*.js` - All JavaScript files
- `app/**/*.js` - Files in app directory
- `src/**/*.{js,jsx}` - Multiple extensions
- `node_modules/react/**` - Specific package
- `**/vendor-*.js` - Files matching pattern

## Threshold Levels

Performance thresholds have three levels:

| Level | Description |
|-------|-------------|
| Pass | Metric is below warn threshold |
| Warn | Metric exceeds warn but below max |
| Fail | Metric exceeds max threshold |

## Examples

### Strict Configuration

```yaml
runtime:
  lcp: 1200
  inp: 100
  cls: 0.05
  score: 95

bundle:
  budgets:
    - path: "app/**/*.js"
      maxSize: 100000
```

### Lenient Configuration

```yaml
runtime:
  lcp: 4000
  inp: 500
  cls: 0.25
  score: 75

bundle:
  budgets:
    - path: "**/*.js"
      maxSize: 500000
```

### Next.js App Router

```yaml
framework: nextjs

bundle:
  budgets:
    - path: "app/**/*.{js,tsx}"
      maxSize: 200000
      name: "App Router"
    - path: ".next/server/**/*.js"
      maxSize: 100000
      name: "Server Components"
```
