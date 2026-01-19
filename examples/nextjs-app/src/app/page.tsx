export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Welcome to
          <span className="block mt-2 text-blue-600">
            Performance Enforcer Demo
          </span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          This is a sample Next.js application configured with Performance Enforcer.
        </p>
        <div className="mt-8 flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Action 1
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300">
            Action 2
          </button>
        </div>
      </div>
    </main>
  );
}
