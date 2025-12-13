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

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PLANNED", label: "Planned" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "ONLINE", label: "Online" },
  { value: "OFFLINE", label: "Offline" },
]

const SORT_OPTIONS = [
  { value: "asc", label: "Earliest First" },
  { value: "desc", label: "Latest First" },
]

export default function EventsPage() {
  const [events, setEvents] = useState<GroupEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("")
  const [sortOrder, setSortOrder] = useState("desc")

  useEffect(() => {
    fetchEvents()
  }, [statusFilter, eventTypeFilter, sortOrder])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (eventTypeFilter) params.set("eventType", eventTypeFilter)
      params.set("sortOrder", sortOrder)

      const res = await fetch(`/api/events?${params.toString()}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Failed to fetch events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Community Events</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Stay updated with our upcoming events and activities.</p>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {EVENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">📅</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No events found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center relative">
                  <span className="text-5xl">{event.eventType === "ONLINE" ? "💻" : "📅"}</span>
                  <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status] || statusColors.PLANNED}`}>
                    {event.status.replace("_", " ")}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                    {new Date(event.eventTime).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    {" • "}
                    {new Date(event.eventTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span>{event.eventType === "ONLINE" ? "💻 Online" : "📍 " + (event.location || "In-person")}</span>
                  </div>
                  <Link
                    href={`/groups/${event.group.id}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    👥 {event.group.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

