export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Photo Gallery</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Memories from our community gatherings and events.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center hover:opacity-80 transition cursor-pointer group"
            >
              <div className="text-center">
                <span className="text-4xl block mb-2">📷</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition">
                  Photo {i + 1}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400">
            More photos coming soon! Check back regularly for updates.
          </p>
        </div>
      </div>
    </div>
  )
}

