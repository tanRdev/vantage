## Performance Enforcer

> Performance budget enforcement for Next.js apps with deep bundle analysis, runtime metrics, and CI/CD integration

[![npm version](https://badge.fury.io/js/vantage.svg)](https://www.npmjs.com/package/vantage)
[![License: MIT](https://img.shields.io/badge/License/MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests/passing/Performance%209Tests/20Tests.svg)](https://img.shields.io/badge/tests/passing/Performance%209Tests20Tests.svg))
[![Type Safety](https://img.shields.io/badge/types/TypeScript-safe-blue)](https://img.shields.io/badge/types/TypeScript-safe-blue.svg)]

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
- 🎨 Local embedded dashboard with shadcn UI components
- 🚀 Interactive treemap visualizations (D3.js)
- 📈 Trend charts (LCP, INP, CLS, bundle size over time)
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
- 📦 Detailed results upload as artifacts

### Configuration
- ⚙️ YAML-based config (`.vantage.yml`)
- ✅ Zod schema validation
- 🎯 Smart defaults for Next.js
- 📝 Route-specific budgets
- 🔍 Per-framework detection
- 🚫 Ignore patterns support

### Developer Experience
- 🚀 Single command setup (`vantage init`)
- ⚡ Zero-config mode
- 💬 Clear error messages with fixes
- 👀 Watch mode for continuous monitoring
- 📤 Export metrics (JSON/CSV)

## Installation

```bash
# npm
npm install -g vantage

# yarn
yarn global add vantage

# pnpm
pnpm add -g vantage
```

## Quick Start

```bash
# Initialize configuration
vantage init

# Run all checks
vantage check

# Analyze bundles
vantage bundle

# Launch dashboard
vantage dashboard
```

## Configuration

Create a `.vantage.yml` file in your project root:

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
- ✅ Handles dynamic routes (`[id]`, `[...slug]`)

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
  push:
    branches: [main, develop]

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run performance checks
        run: |
          npx vantage check || true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_REF: ${{ github.ref }}
          GITHUB_SHA: ${{ github.sha }}

      - name: Post results to PR
        if: github.event_name == 'pull_request'
          run: |
            node dist/integrations/github.js post-comment
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            GITHUB_REPOSITORY: ${{ github.repository }}
            GITHUB_PR_NUMBER: ${{ github.event.pull_request.number }}

      - name: Set status check
        if: github.event_name == 'pull_request'
          run: |
            node dist/integrations/github.js set-status
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            GITHUB_REPOSITORY: ${{ github.repository }}
            GITHUB_SHA: ${{ github.sha }}

      - name: Upload artifacts
        if: always()
          uses: actions/upload-artifact@v4
          with:
            name: performance-results
            path: .vantage/
            retention-days: 30
```

See [CI/CD Setup](docs/ci-setup.md) for detailed configuration.

## Dashboard

### Local Development

```bash
vantage dashboard
```

Opens at http://localhost:3000

### Deploy to GitHub Pages

```bash
vantage dashboard --deploy
```

Follow instructions to deploy your dashboard to GitHub Pages.

## Examples

See `examples/` directory for sample Next.js apps configured with Performance Enforcer.

## Examples

### Example Next.js App

- Working Next.js 15 app with App Router
- Sample home page component
- Performance configuration
- TypeScript + React configuration

See [examples/nextjs-app/](examples/nextjs-app/README.md) for setup.

## Contributing

Contributions welcome! Please read [Contributing Guidelines](CONTRIBUTING.md).

## Roadmap

### v1.0 (Current)
- [x] CLI foundation
- [x] Bundle analysis
- [x] Runtime metrics
- [x] Dashboard with shadcn UI
- [x] GitHub Actions integration
- [x] Comprehensive testing
- [x] Complete documentation
- [x] Example apps

### v2.0 (Planned)
- [ ] Turbopack support
- [ ] Visual regression tests (Playwright)
- [ ] React (CRA + Vite) support
- [ ] Vue 3 (Vite) support
- [ ] SvelteKit support
- [ ] GitLab CI integration
- [ ] Bitbucket Pipelines integration
- [ ] Dashboard config editor via UI
- [ ] GitLab CI integration

## License

MIT © [Your Name]

