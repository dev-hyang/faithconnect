"use client"

import { useState, useEffect } from "react"

interface Testimony {
  id: string
  title: string
  description: string
  createdAt: string
  user: {
    id: string
    fullName: string | null
    image: string | null
  }
}

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchTestimonies()
  }, [])

  const fetchTestimonies = async () => {
    try {
      const res = await fetch("/api/testimonies")
      const data = await res.json()
      setTestimonies(data.testimonies || [])
    } catch (error) {
      console.error("Failed to fetch testimonies:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Testimonies</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Read inspiring stories of faith from our community members.
        </p>

        {testimonies.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">✝️</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No testimonies yet</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back soon for inspiring stories from our community.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {testimonies.map((testimony) => (
              <div
                key={testimony.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center flex-shrink-0">
                      {testimony.user.image ? (
                        <img src={testimony.user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                        {testimony.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        By {testimony.user.fullName || "Anonymous"} •{" "}
                        {new Date(testimony.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <div className="text-gray-700 dark:text-gray-300">
                        {expandedId === testimony.id ? (
                          <p className="whitespace-pre-wrap">{testimony.description}</p>
                        ) : (
                          <p className="line-clamp-3">{testimony.description}</p>
                        )}
                      </div>
                      {testimony.description.length > 200 && (
                        <button
                          onClick={() => setExpandedId(expandedId === testimony.id ? null : testimony.id)}
                          className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                        >
                          {expandedId === testimony.id ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

