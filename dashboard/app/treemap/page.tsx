import { BundleTreemap } from '../../components/charts/BundleTreemap'

export default function TreemapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Bundle Treemap
        </h1>
        <p className="text-muted-foreground">
          Visualize your bundle composition and identify large dependencies
        </p>
      </div>

      <BundleTreemap />
    </div>
  )
}
