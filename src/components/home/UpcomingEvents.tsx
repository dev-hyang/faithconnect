"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface GroupEvent {
  id: string
  title: string
  description: string | null
  eventTime: string
  eventType: string
  location: string | null
  status: string
  group: {
    id: string
    name: string
    visibility: string
  }
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<GroupEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingEvents()
  }, [])

  const fetchUpcomingEvents = async () => {
    try {
      const res = await fetch("/api/events?upcoming=true&sortOrder=asc&limit=3")
      const data = await res.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Failed to fetch upcoming events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border dark:border-gray-700 rounded-xl overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition">
            <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
              <span className="text-4xl">📅</span>
            </div>
            <div className="p-6">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Coming Soon</p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Event Title {i}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Join us for an upcoming community event. Stay tuned for more details!</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/groups/${event.group.id}`}
          className="border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition block"
        >
          <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center">
            <span className="text-4xl">{event.eventType === "ONLINE" ? "💻" : "📅"}</span>
          </div>
          <div className="p-6">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
              {new Date(event.eventTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              {" • "}
              {new Date(event.eventTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
              {event.description || `Hosted by ${event.group.name}`}
            </p>
            <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <span>{event.eventType === "ONLINE" ? "💻 Online" : "📍 " + (event.location || "In-person")}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

