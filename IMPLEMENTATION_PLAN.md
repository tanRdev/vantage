# Performance Enforcer - Implementation Plan

## Project Decisions

- **Name**: `vantage`
- **Framework**: Next.js MVP (App + Pages Router)
- **Bundle Analysis**: Deep (treemaps, module-level, dependency impact)
- **Dashboard**: Local + optional GitHub Pages/Netlify deploy
- **Visual Regression**: Defer to v2.0
- **Bundle Parser**: Webpack-only (Turbopack v2.0)
- **Dashboard Mode**: View-only
- **Tests**: Unit only (integration in pipeline backlog)
- **CI/CD**: GitHub Actions (GitLab, Bitbucket in pipeline)
- **Readme**: Full feature list + roadmap

---

## Tech Stack

- **CLI**: oclif (TypeScript)
- **Bundle Analysis**: Custom parser for Next.js build artifacts
- **Runtime Metrics**: @lhci/cli, web-vitals
- **Dashboard**: Next.js 15 + Tremor React + D3.js
- **Config**: YAML (Zod schema validation)
- **Storage**: SQLite (better-sqlite3)
- **Testing**: Vitest + Playwright (e2e)
- **Styling**: Tailwind CSS

---

## All Features for README

### Core Features
- Bundle size analysis with deep module-level breakdown
- Dependency tree visualization (interactive treemaps)
- Bundle diff vs baseline with impact attribution
- Budget enforcement (absolute + percentage thresholds)
- Duplicate code detection
- Dead code identification
- Per-chunk size limits

### Runtime Performance
- Lighthouse integration (multi-route testing)
- Core Web Vitals collection (LCP, INP, CLS, TBT, FCP)
- Next.js App Router + Pages Router auto-detection
- Dynamic route pattern handling
- ISR/SSG detection
- Historical trend tracking

### Dashboard
- Local embedded dashboard
- Optional GitHub Pages deployment
- Interactive treemap visualizations (D3.js)
- Trend charts (LCP, INP, CLS, bundle size over time)
- Per-route performance breakdown
- Build history timeline
- Commit comparison view
- Dark mode support

### CI/CD Integration
- GitHub Actions workflow
- PR comment generation (formatted tables)
- Status check integration
- Automatic baseline comparison
- Multi-run Lighthouse (median values)

### Configuration
- YAML-based config (`.vantage.yml`)
- Zod schema validation
- Smart defaults for Next.js
- Route-specific budgets
- Per-framework detection
- Ignore patterns support

### Developer Experience
- Single command setup (`vantage init`)
- Zero-config mode
- Clear error messages with fixes
- Watch mode for continuous monitoring
- Export metrics (JSON/CSV)

---

## Implementation Timeline (6 weeks)

### Week 1: Foundation (Day 1-14)
- [x] Project setup (monorepo, TypeScript, Vitest)
- [x] Core modules: config, storage, logger, reporter, threshold
- [x] Unit tests for core

### Week 2: Bundle Analysis (Day 15-28)
- [ ] Next.js parser (version, router type, build artifacts)
- [ ] Deep analysis: module-level, dependency tree, duplicates, dead code
- [ ] Bundle differ (vs baseline)
- [ ] Visualization: D3 treemaps, module tables
- [ ] Budget enforcement

### Week 3: Runtime Metrics (Day 29-42)
- [ ] Route detection (App + Pages Router, dynamic patterns)
- [ ] Lighthouse integration (multi-URL, median values)
- [ ] Core Web Vitals instrumentation
- [ ] Historical tracking in SQLite

### Week 4: Dashboard (Day 43-56)
- [ ] Next.js 15 App Router setup
- [ ] Components: TrendChart, BundleTreemap, ModuleTable, RouteTable, HistoryTimeline, ComparisonView
- [ ] Dashboard server + GitHub Pages deploy
- [ ] Watch mode

### Week 5: CI/CD (Day 57-63)
- [ ] GitHub Actions workflow
- [ ] PR comment formatting (tables, diffs, recommendations)
- [ ] Status check integration
- [ ] Documentation

### Week 6: Polish (Day 64-90)
- [ ] Complete docs (README, guides, examples)
- [ ] Example Next.js apps
- [ ] Testing + performance validation
- [ ] Release prep (CHANGELOG, semantic versioning)

---

## Progress Update (Jan 19, 2026)

### Completed
- ✅ Foundation
  - CLI framework with oclif
  - Core modules (config, storage, logger, reporter, threshold)
  - Commands: init, check, bundle, dashboard
  - Working build process
  - Tested basic CLI functionality

- ✅ Bundle Analysis
  - Next.js parser (version, router type detection)
  - Build manifest parser
  - Deep analysis module:
    - Chunk analysis with size calculations
    - Module extraction and analysis
    - Duplicate code detection
    - Dead code identification
    - Budget checking logic
  - Bundle diff comparison
  - Treemap data generation
  - Treemap HTML visualization (D3.js)
  - Updated bundle command with full analysis
  - Unit tests for analyzer, parser, threshold

- ✅ Runtime Metrics
  - Route detection (App + Pages Router, dynamic patterns)
  - Route exclusion patterns
  - Lighthouse runner:
    - Multi-URL testing
    - Multiple run support with median calculation
    - Desktop/mobile preset support
    - Throttling configuration
  - Web Vitals collector:
    - Core Web Vitals instrumentation (LCP, INP, CLS, FCP, TTFB)
    - Browser environment detection
    - Real-time threshold checking with visual status
    - Optional remote reporting
    - Code generation for instrumentation
  - Combined runtime and bundle checks in single command

- ✅ Dashboard
  - Next.js 15 App Router setup
  - Components:
    - TrendChart (Recharts area charts)
    - BundleTable (size and status)
    - RouteTable (performance by route)
    - BundleTreemap (D3.js interactive treemap)
    - Header and Footer layout
  - Dashboard server (local dev)
  - GitHub Pages deployment support
  - Tailwind CSS styling
  - Quick stats cards
  - Responsive design

- ✅ CI/CD Integration
  - GitHub Actions workflow:
    - Runs on pull requests and pushes
    - Executes performance checks
    - Posts results to PR comments
    - Sets status checks (pass/fail)
    - Uploads artifacts with detailed results
  - GitHub integration:
    - Octokit client for GitHub API
    - PR comment posting with formatted tables
    - Status check updating
    - Comment update/creation logic
    - Results formatting (metrics, deltas, status)
  - CI/CD documentation:
    - GitHub PAT setup guide
    - Repository secrets configuration
    - Workflow triggers explanation
    - PR comment format examples
    - Status check behavior
    - Artifacts download guide
    - Troubleshooting section
    - Customization examples
    - Best practices
  - Web-vitals dependency added
  - Octokit dependency added

### Next Steps
- Polish (Documentation, examples, release)
  - [ ] Complete docs (README, guides, examples)
  - [ ] Example Next.js apps
  - [ ] Testing + performance validation
  - [ ] Release prep (CHANGELOG, semantic versioning)

---

## Pipeline Notes (v2.0 Features)

### Framework Support
- [ ] Turbopack support (currently Webpack-only)
- [ ] React (CRA + Vite)
- [ ] Vue 3 (Vite)
- [ ] SvelteKit

### CI/CD Platforms
- [ ] GitLab CI
- [ ] Bitbucket Pipelines

### Testing
- [ ] Integration tests (currently unit only)

### Dashboard
- [ ] Config editor via UI (currently view-only)

### Visual Regression
- [ ] Playwright integration
- [ ] Baseline management
- [ ] Multi-viewport testing

---

## Key Technical Specs

### Bundle Analysis
- Parse `build-manifest.json`, `pages-manifest.json`
- Module-level analysis with dependency graph
- Duplicate code detection by module name
- Dead code: unreferenced modules
- Diff: added, removed, modified with size deltas

### SQLite Schema
```sql
CREATE TABLE builds (
  id INTEGER PRIMARY KEY,
  commit_sha TEXT NOT NULL,
  branch TEXT,
  timestamp INTEGER NOT NULL,
  total_bundle_size INTEGER,
  lcp REAL,
  inp REAL,
  cls REAL
);

CREATE TABLE routes (
  id INTEGER PRIMARY KEY,
  build_id INTEGER REFERENCES builds(id),
  path TEXT NOT NULL,
  lcp REAL,
  inp REAL,
  cls REAL,
  score INTEGER
);

CREATE TABLE bundles (
  id INTEGER PRIMARY KEY,
  build_id INTEGER REFERENCES builds(id),
  chunk_name TEXT NOT NULL,
  size INTEGER NOT NULL,
  module_count INTEGER
);
```

### Config Schema
```yaml
framework: nextjs
bundle:
  analysis: deep
  outputDir: .next
  treemap: true
  budgets:
    - path: "app/**/*.js"
      max: 100kb
  thresholds:
    regression: 10
    warning: 5
runtime:
  routes:
    - /
    - /dashboard
  thresholds:
    lcp: 2500ms
    inp: 200ms
    cls: 0.1
```

---

## Success Metrics

### Technical
- Next.js 13-15 support (App + Pages Router)
- Webpack + Turbopack support
- <2s `vantage check` execution
- 90%+ test coverage
- Zero critical vulnerabilities

### Portfolio Impact
- 500+ GitHub stars
- 100+ npm weekly downloads
- Featured in Next.js ecosystem lists

---

## Dependencies

```json
{
  "dependencies": {
    "oclif": "^4.0",
    "yaml": "^2.5",
    "zod": "^3.22",
    "better-sqlite3": "^11.0",
    "d3": "^7.9",
    "@lhci/cli": "^0.13",
    "web-vitals": "^4.0",
    "winston": "^3.11"
  },
  "devDependencies": {
    "@types/node": "^20.0",
    "@types/d3": "^7.4",
    "vitest": "^2.0",
    "@vitest/ui": "^2.0",
    "typescript": "^5.5",
    "next": "^15.0",
    "@tremor/react": "^4.0",
    "tailwindcss": "^4.0",
    "eslint": "^9.0",
    "prettier": "^3.2"
  }
}
```
