"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Testimony {
  id: string
  title: string
  description: string
  user: { fullName: string | null; email: string }
  createdAt: string
}

export default function TestimoniesPreview() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTestimonies = async () => {
      try {
        const res = await fetch("/api/testimonies")
        const data = await res.json()
        // Take up to 6 for display
        setTestimonies((data.testimonies || []).slice(0, 6))
      } catch (error) {
        console.error("Failed to fetch testimonies:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonies()
  }, [])

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Testimonies</h2>
            <Link href="/testimonies" className="text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (testimonies.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Testimonies</h2>
            <Link href="/testimonies" className="text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <span className="text-4xl mb-4 block">✝️</span>
            <p className="text-gray-500 dark:text-gray-400">No testimonies yet. Be the first to share your story!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Testimonies</h2>
          <Link href="/testimonies" className="text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonies.map((testimony) => (
            <div key={testimony.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {(testimony.user.fullName || testimony.user.email)[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{testimony.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {testimony.user.fullName || testimony.user.email}
                  </p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                {testimony.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

