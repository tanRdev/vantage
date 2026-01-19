export function BundleTable() {
  const bundles: Array<{ name: string; size: number; modules: number; status: "ok" | "warning" }> = [
    { id: 1, name: "main.js", size: 120, modules: 45, status: "ok" },
    { id: 2, name: "vendor.js", size: 85, modules: 12, status: "ok" },
    { id: 3, name: "app.js", size: 40, modules: 8, status: "warning" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Chunk
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Size
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Modules
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {bundles.map((bundle) => (
            <tr key={bundle.id} className="border-b border-gray-100">
              <td className="py-3 px-4">{bundle.name}</td>
              <td className="py-3 px-4">{bundle.size}KB</td>
              <td className="py-3 px-4">{bundle.modules}</td>
              <td className="py-3 px-4">
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bundle.status === "ok"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                  {bundle.status === "ok" ? "✓ OK" : "⚠ Warning"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
