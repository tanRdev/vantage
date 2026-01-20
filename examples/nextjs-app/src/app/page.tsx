import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen py-12">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Welcome to Performance Enforcer
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            A sample Next.js application configured with Performance Enforcer for
            automatic performance monitoring and enforcement.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-lg mb-2">Bundle Analysis</h3>
              <p className="text-gray-600 text-sm">
                Track bundle size changes and module composition over time
              </p>
            </div>

            <div className="card">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-lg mb-2">Runtime Metrics</h3>
              <p className="text-gray-600 text-sm">
                Monitor Core Web Vitals and Lighthouse scores
              </p>
            </div>

            <div className="card">
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-semibold text-lg mb-2">Performance Gates</h3>
              <p className="text-gray-600 text-sm">
                Enforce performance budgets in CI/CD pipelines
              </p>
            </div>
          </div>

          <div className="mt-12 flex gap-4 justify-center">
            <Link href="/dashboard" className="btn btn-primary">
              View Dashboard
            </Link>
            <Link href="/about" className="btn btn-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
