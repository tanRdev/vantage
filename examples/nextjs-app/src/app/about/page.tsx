export default function AboutPage() {
  return (
    <main className="min-h-screen py-12">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About Performance Enforcer</h1>

          <section className="card mb-6">
            <h2 className="text-xl font-semibold mb-3">What is Performance Enforcer?</h2>
            <p className="text-gray-600 mb-4">
              Performance Enforcer is a CLI tool for Next.js applications that provides
              comprehensive performance monitoring and enforcement. It helps teams maintain
              performance standards by automatically checking bundle sizes and runtime metrics.
            </p>
          </section>

          <section className="card mb-6">
            <h2 className="text-xl font-semibold mb-3">Features</h2>
            <ul className="space-y-2 text-gray-600">
              <li>Bundle size analysis with module-level breakdown</li>
              <li>Runtime performance metrics via Lighthouse CI</li>
              <li>Core Web Vitals tracking (LCP, INP, CLS)</li>
              <li>Interactive dashboard for historical trends</li>
              <li>CI/CD integration with GitHub Actions</li>
              <li>Configurable performance budgets</li>
            </ul>
          </section>

          <section className="card">
            <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <p>$ npm install -g performance-enforcer</p>
              <p className="mt-2">$ performance-enforcer init</p>
              <p className="mt-2">$ performance-enforcer check</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
