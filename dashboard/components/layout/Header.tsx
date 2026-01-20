export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⚡</span>
          <h1 className="text-xl font-bold text-gray-900">
            Vantage
          </h1>
        </div>
        <nav className="flex items-center space-x-6">
          <a
            href="/"
            className="text-gray-700 hover:text-gray-900 font-medium"
          >
            Dashboard
          </a>
          <a
            href="/treemap"
            className="text-gray-700 hover:text-gray-900 font-medium"
          >
            Treemap
          </a>
          <a
            href="/history"
            className="text-gray-700 hover:text-gray-900 font-medium"
          >
            History
          </a>
        </nav>
      </div>
    </header>
  );
}
