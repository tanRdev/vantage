import { BundleTreemap } from "../components/charts/BundleTreemap";

export default function TreemapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bundle Treemap
        </h1>
        <p className="text-gray-600 mb-8">
          Visualize your bundle composition and identify large dependencies
        </p>

        <BundleTreemap />
      </div>
    </div>
  );
}
