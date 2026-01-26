<div align="center">

  <img src="docs/assets/logo.png" alt="Vantage Logo" width="120" />

  # Vantage

  ### Performance budget enforcement for Next.js apps

  [![npm version](https://badge.fury.io/js/vantage.svg)](https://www.npmjs.com/package/vantage)
  [![License: MIT](https://img.shields.io/badge/License/MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

  **Deep bundle analysis · Runtime metrics · Beautiful dashboard · CI/CD integration**

</div>

---

## Features

### Bundle Analysis

- **Deep module-level breakdown** — See exactly what's in your bundles
- **Interactive treemap visualization** — D3.js-powered visual exploration
- **Bundle diff vs baseline** — Track changes over time
- **Smart budget enforcement** — Absolute and percentage thresholds
- **Duplicate code detection** — Find redundant code across chunks
- **Dead code identification** — Spot unused exports and dependencies
- **Per-chunk size limits** — Fine-grained control

### Runtime Performance

- **Lighthouse integration** — Multi-route automated testing
- **Core Web Vitals** — LCP, INP, CLS, FCP, TTFB tracking
- **Smart route detection** — App Router + Pages Router support
- **Dynamic pattern handling** — `[id]`, `[...slug]` automatically detected
- **ISR/SSG detection** — Know your rendering strategy
- **Historical trends** — Performance data over time

### Dashboard

> A modern performance monitoring dashboard built with Next.js 15 and shadcn/ui

- **Dark theme** — Clean, data-focused interface
- **Real-time data visualization** — Live updates via Server-Sent Events
- **Trend charts** — Recharts-powered metric graphs
- **Interactive treemaps** — Explore bundle composition visually
- **Search & filter** — Find what you need instantly
- **Keyboard navigation** — Fully accessible interface
- **Responsive design** — Works on any device

### CI/CD Integration

- **GitHub Actions workflow** — Drop-in integration
- **PR comment generation** — Formatted results tables
- **Status check integration** — Pass/fail on PR
- **Baseline comparison** — Track regressions automatically
- **Multi-run Lighthouse** — Median values for accuracy
- **Artifact uploads** — Detailed results preserved

---

## Installation

```bash
# npm
npm install -g vantage

# yarn
yarn global add vantage

# pnpm
pnpm add -g vantage
```

---

## Quick Start

```bash
# Initialize configuration (creates .vantage.yml)
vantage init

# Run all performance checks
vantage check

# Analyze bundles only
vantage bundle

# Launch the dashboard
vantage dashboard
```

**Dashboard opens at** `http://localhost:3000`

---

## Configuration

Create a `.vantage.yml` file in your project root:

```yaml
# Framework detection
framework: nextjs

# Bundle Analysis
bundle:
  analysis: deep              # deep | standard
  outputDir: .next           # Build output directory
  treemap: true              # Generate treemap visualization
  budgets:
    - path: "app/**/*.js"
      max: 100kb
    - path: "chunks/main-*.js"
      max: 150kb
  thresholds:
    regression: 10          # % increase that triggers failure
    warning: 5              # % increase that triggers warning

# Runtime Performance
runtime:
  routes:
    - /
    - /dashboard
    - /checkout
  exclude:
    - "/api/**"
    - "/_next/**"
  thresholds:
    lcp: 2500                 # Largest Contentful Paint (ms)
    inp: 200                  # Interaction to Next Paint (ms)
    cls: 0.1                  # Cumulative Layout Shift
    tbt: 300                  # Total Blocking Time (ms)
  lighthouse:
    numberOfRuns: 3          # Run multiple times for accuracy
    preset: desktop          # desktop | mobile
    throttling: fast-3g      # Network throttling
```

---

## Commands

| Command | Description |
|---------|-------------|
| `vantage init` | Initialize configuration file |
| `vantage check` | Run all performance checks (bundle + runtime) |
| `vantage bundle` | Analyze bundle size and composition |
| `vantage dashboard` | Launch performance dashboard |
| `vantage github` | GitHub Actions integration |

---

## Dashboard Preview

### Main Dashboard
- **Quick stats cards** — LCP, INP, CLS, Bundle Size at a glance
- **Performance trends** — Interactive charts showing metrics over time
- **Bundle analysis** — Searchable table with status indicators
- **Route performance** — Per-route breakdown with scores

### Treemap View
- **Interactive visualization** — Click to explore bundle composition
- **Color-coded sizes** — Green (good) → Yellow (warning) → Red (critical)
- **Keyboard navigation** — Full accessibility support

### Dashboard Features
- **Auto-refresh** — Live data updates via Server-Sent Events
- **Search & filter** — Find specific bundles or routes
- **Keyboard accessible** — Full keyboard navigation support

### Dashboard Configuration

The dashboard can be configured with environment variables. Create a `.env.local` file in the `dashboard/` directory:

```bash
# SSE Server URL (default: http://localhost:3001)
NEXT_PUBLIC_SSE_URL=http://localhost:3001
```

See `dashboard/.env.example` for a complete list of available configuration options.

---

## Project Structure

```
vantage/
├── src/
│   ├── commands/          # CLI commands
│   │   ├── init.ts
│   │   ├── check.ts
│   │   ├── bundle.ts
│   │   ├── dashboard.ts
│   │   └── github.ts
│   ├── analyzers/
│   │   ├── bundle/         # Bundle analysis logic
│   │   └── runtime/        # Runtime metrics logic
│   ├── core/              # Configuration, storage, reporting
│   ├── integrations/      # GitHub API integration
│   └── templates/         # HTML/CSS templates
├── dashboard/            # Next.js Dashboard
│   ├── app/
│   │   ├── api/           # API routes for real-time data
│   │   ├── page.tsx       # Main dashboard
│   │   └── treemap/       # Bundle treemap
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── charts/        # Charts and visualizations
│   │   └── layout/        # Header, Footer
│   └── lib/               # Storage layer, utilities
├── tests/                # Unit tests
└── examples/             # Example Next.js app
```

---

## Next.js Integration

### App Router
- Auto-detects routes from `app/` directory
- Handles dynamic routes (`[id]`, `[...slug]`)
- Excludes API routes and middleware automatically

### Pages Router
- Auto-detects routes from `pages/` directory
- Supports all dynamic route patterns

### Supported Frameworks
| Framework | Status | Notes |
|-----------|--------|-------|
| Next.js App Router | Supported | Auto-detection |
| Next.js Pages Router | Supported | Auto-detection |
| Turbopack | Planned | v2.0 roadmap |
| React (CRA) | Planned | v2.0 roadmap |
| Vue 3 / Vite | Planned | v2.0 roadmap |

---

## CI/CD Setup

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Vantage
        run: npm install -g vantage

      - name: Run performance checks
        run: vantage check
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          GITHUB_REF: ${{ github.ref }}
          GITHUB_SHA: ${{ github.sha }}

      - name: Post results to PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            node dist/integrations/github.js post-comment

      - name: Set status check
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            node dist/integrations/github.js set-status
```

---

## Roadmap

### v1.0 — Current Release
- [x] CLI foundation with oclif
- [x] Deep bundle analysis
- [x] Runtime metrics with Lighthouse
- [x] Modern dashboard with shadcn/ui
- [x] Dark theme
- [x] Real-time data integration
- [x] Keyboard navigation & accessibility
- [x] GitHub Actions integration
- [x] Comprehensive test coverage
- [x] TypeScript throughout

### v2.0 — Planned
- [ ] Turbopack support
- [ ] Visual regression tests (Playwright)
- [ ] React (Vite/CRA) support
- [ ] Vue 3 (Nuxt/Vite) support
- [ ] SvelteKit support
- [ ] GitLab CI integration
- [ ] Bitbucket Pipelines integration
- [ ] Dashboard config editor (UI)
- [ ] Custom metric definitions

---

## Documentation

- [Configuration Reference](docs/configuration.md)
- [Usage Guide](docs/usage.md)
- [CI/CD Setup](docs/ci-setup.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT © [Tan](https://github.com/tanRdev)

---

<div align="center">

  **Built with TypeScript, Next.js, and shadcn/ui**

  [github.com/tanRdev/vantage](https://github.com/tanRdev/vantage)

</div>
