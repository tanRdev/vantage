export default function DashboardPage() {
  return (
    <main className="min-h-screen py-12">
      <div className="container">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Performance Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">LCP</p>
            <p className="text-2xl font-bold text-green-600">1.2s</p>
            <p className="text-xs text-gray-400 mt-1">Target: &lt;2.5s</p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-500 mb-1">INP</p>
            <p className="text-2xl font-bold text-green-600">85ms</p>
            <p className="text-xs text-gray-400 mt-1">Target: &lt;200ms</p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-500 mb-1">CLS</p>
            <p className="text-2xl font-bold text-green-600">0.02</p>
            <p className="text-xs text-gray-400 mt-1">Target: &lt;0.1</p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Score</p>
            <p className="text-2xl font-bold text-green-600">95</p>
            <p className="text-xs text-gray-400 mt-1">Lighthouse</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Bundle Size Trend</h2>
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              <p>Visualization placeholder</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Runtime Metrics Trend</h2>
            <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              <p>Visualization placeholder</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Builds</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Build</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Bundle</th>
                  <th className="text-left py-2 px-3">LCP</th>
                  <th className="text-left py-2 px-3">Score</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">#42</td>
                  <td className="py-2 px-3 text-gray-500">Today</td>
                  <td className="py-2 px-3">245 KB</td>
                  <td className="py-2 px-3">1.2s</td>
                  <td className="py-2 px-3">95</td>
                  <td className="py-2 px-3"><span className="text-green-600">PASS</span></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">#41</td>
                  <td className="py-2 px-3 text-gray-500">Yesterday</td>
                  <td className="py-2 px-3">238 KB</td>
                  <td className="py-2 px-3">1.1s</td>
                  <td className="py-2 px-3">96</td>
                  <td className="py-2 px-3"><span className="text-green-600">PASS</span></td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">#40</td>
                  <td className="py-2 px-3 text-gray-500">2 days ago</td>
                  <td className="py-2 px-3">252 KB</td>
                  <td className="py-2 px-3">1.3s</td>
                  <td className="py-2 px-3">93</td>
                  <td className="py-2 px-3"><span className="text-yellow-600">WARN</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
