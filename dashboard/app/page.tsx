import type { Metadata } from "next";
import { TrendChart } from "../components/charts/TrendChart";
import { BundleTable } from "../components/charts/BundleTable";
import { RouteTable } from "../components/charts/RouteTable";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";

export const metadata: Metadata = {
  title: "Performance Enforcer Dashboard",
  description: "Performance metrics and bundle analysis for your Next.js application",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Performance Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your application's performance and bundle size over time
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Trends</h2>
            <TrendChart />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Bundle Analysis</h2>
            <BundleTable />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Route Performance</h2>
          <RouteTable />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">LCP</div>
              <div className="text-2xl font-bold text-blue-900">1.2s</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">INP</div>
              <div className="text-2xl font-bold text-green-900">45ms</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">CLS</div>
              <div className="text-2xl font-bold text-purple-900">0.05</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium mb-1">Bundle</div>
              <div className="text-2xl font-bold text-orange-900">245KB</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
