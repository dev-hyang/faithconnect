export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Community Events</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Stay updated with our upcoming events and activities.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
                <span className="text-6xl">📅</span>
              </div>
              <div className="p-6">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Coming Soon</p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Event {i}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Join us for an exciting community event. More details will be announced soon!
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>📍 Location TBD</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

