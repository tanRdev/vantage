export function RouteTable() {
  const routes = [
    { path: "/", lcp: 1.2, inp: 35, cls: 0.02, score: 95 },
    { path: "/dashboard", lcp: 2.1, inp: 55, cls: 0.08, score: 88 },
    { path: "/checkout", lcp: 1.8, inp: 40, cls: 0.03, score: 92 },
    { path: "/about", lcp: 1.5, inp: 42, cls: 0.04, score: 94 },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Route
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              LCP
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              INP
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              CLS
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-3 px-4 font-mono">{route.path}</td>
              <td className="py-3 px-4">{route.lcp}s</td>
              <td className="py-3 px-4">{route.inp}ms</td>
              <td className="py-3 px-4">{route.cls}</td>
              <td className="py-3 px-4">
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      route.score >= 90
                        ? "bg-green-100 text-green-800"
                        : route.score >= 80
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                >
                  {route.score}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
