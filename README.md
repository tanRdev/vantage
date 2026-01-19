# Performance Enforcer

> Performance budget enforcement for Next.js apps with deep bundle analysis, runtime metrics, and CI/CD integration

[![npm version](https://badge.fury.io/js/performance-enforcer.svg)](https://www.npmjs.com/package/performance-enforcer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### Core Features
- 📦 Bundle size analysis with deep module-level breakdown
- 🌳 Dependency tree visualization (interactive treemaps)
- 📊 Bundle diff vs baseline with impact attribution
- 🎯 Budget enforcement (absolute + percentage thresholds)
- 🔍 Duplicate code detection
- 💀 Dead code identification
- 📦 Per-chunk size limits

### Runtime Performance
- ⚡ Lighthouse integration (multi-route testing)
- 📈 Core Web Vitals collection (LCP, INP, CLS, TBT, FCP)
- 🔎 Next.js App Router + Pages Router auto-detection
- 🔄 Dynamic route pattern handling
- ⚙️ ISR/SSG detection
- 📊 Historical trend tracking

### Dashboard
- 🎨 Local embedded dashboard
- 🚀 Optional GitHub Pages deployment
- 📈 Interactive treemap visualizations (D3.js)
- 📊 Trend charts (LCP, INP, CLS, bundle size over time)
- 🗺 Per-route performance breakdown
- 📅 Build history timeline
- 🔍 Commit comparison view
- 🌙 Dark mode support

### CI/CD Integration
- 🤖 GitHub Actions workflow
- 💬 PR comment generation (formatted tables)
- ✅ Status check integration
- 📉 Automatic baseline comparison
- 🔄 Multi-run Lighthouse (median values)

### Configuration
- ⚙️ YAML-based config (`.performance-enforcer.yml`)
- ✅ Zod schema validation
- 🎯 Smart defaults for Next.js
- 📝 Route-specific budgets
- 🔍 Per-framework detection
- 🚫 Ignore patterns support

### Developer Experience
- 🚀 Single command setup (`performance-enforcer init`)
- ⚡ Zero-config mode
- 💬 Clear error messages with fixes
- 👀 Watch mode for continuous monitoring
- 📤 Export metrics (JSON/CSV)

## Installation

```bash
# npm
npm install -g performance-enforcer

# yarn
yarn global add performance-enforcer

# pnpm
pnpm add -g performance-enforcer
```

## Quick Start

```bash
# Initialize configuration
performance-enforcer init

# Run all checks
performance-enforcer check

# Analyze bundles
performance-enforcer bundle

# Launch dashboard
performance-enforcer dashboard
```

## Configuration

Create a `.performance-enforcer.yml` file in your project root:

```yaml
framework: nextjs

# Bundle Analysis Configuration
bundle:
  analysis: deep
  outputDir: .next
  treemap: true
  budgets:
    - path: "app/**/*.js"
      max: 100kb
    - path: "chunks/main-*.js"
      max: 150kb
  thresholds:
    regression: 10
    warning: 5

# Runtime Performance Configuration
runtime:
  routes:
    - /
    - /dashboard
    - /checkout
  exclude:
    - "/api/**"
    - "/_next/**"
  thresholds:
    lcp: 2500
    inp: 200
    cls: 0.1
    tbt: 300
  lighthouse:
    numberOfRuns: 3
    preset: desktop
    throttling: fast-3g
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize configuration |
| `check` | Run all performance checks |
| `bundle` | Analyze bundle size and composition |
| `dashboard` | Launch performance dashboard |

## Next.js Integration

### App Router
- ✅ Fully supported
- ✅ Auto-detects routes from `app/` directory
- ✅ Handles dynamic routes (`[id]`, `[...slug]`)
- ✅ Excludes API routes and middleware

### Pages Router
- ✅ Fully supported
- ✅ Auto-detects routes from `pages/` directory
- ✅ Handles dynamic routes

### Turbopack
- 🔄 Planned for v2.0
- Currently Webpack-only

See [Next.js Guide](docs/nextjs-guide.md) for detailed setup.

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/performance.yml`:

```yaml
name: Performance Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx performance-enforcer check
```

See [CI/CD Setup](docs/ci-setup.md) for detailed configuration.

## Dashboard

### Local Development

```bash
performance-enforcer dashboard
```

Opens at http://localhost:3000

### Deploy to GitHub Pages

```bash
performance-enforcer dashboard --deploy
```

Follow the instructions to deploy your dashboard to GitHub Pages.

## Examples

See `examples/` directory for sample Next.js apps configured with Performance Enforcer.

## Contributing

Contributions welcome! Please read [Contributing Guidelines](CONTRIBUTING.md).

## Roadmap

### v1.0
- [x] CLI foundation
- [x] Bundle analysis
- [x] Runtime metrics
- [x] Dashboard
- [x] GitHub Actions integration
- [ ] Complete documentation
- [ ] Example apps

### v2.0 (Planned)
- [ ] Turbopack support
- [ ] Visual regression tests (Playwright)
- [ ] React (CRA + Vite) support
- [ ] Vue 3 (Vite) support
- [ ] SvelteKit support
- [ ] GitLab CI integration
- [ ] Bitbucket Pipelines integration
- [ ] Dashboard config editor via UI

## License

MIT © [Your Name]
