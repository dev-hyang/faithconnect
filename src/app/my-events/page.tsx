"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface GroupEvent {
  id: string
  title: string
  description: string | null
  eventTime: string
  eventType: string
  location: string | null
  status: string
  groupId: string
  canEdit: boolean
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

export default function MyEventsPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<GroupEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [eventTypeFilter, setEventTypeFilter] = useState("")
  const [sortOrder, setSortOrder] = useState("desc")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openMenuId])

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchEvents()
    }
  }, [authStatus, statusFilter, eventTypeFilter, sortOrder])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (eventTypeFilter) params.set("eventType", eventTypeFilter)
      params.set("sortOrder", sortOrder)

      const res = await fetch(`/api/user/events?${params.toString()}`)
      const data = await res.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Failed to fetch events:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleEventStatusChange = async (event: GroupEvent, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      IN_PROGRESS: "start",
      COMPLETED: "complete",
      CANCELLED: "cancel"
    }
    const action = statusLabels[newStatus] || "update"

    if (!confirm(`Are you sure you want to ${action} this event?`)) return

    try {
      const response = await fetch(`/api/groups/${event.groupId}/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: `Event ${action}ed successfully` })
        fetchEvents() // Refresh the events list
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: `Failed to ${action} event` })
    }
  }

  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  const canShowActions = (event: GroupEvent) =>
    event.canEdit && (event.status === "PLANNED" || event.status === "IN_PROGRESS")

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">My Events</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Events from groups you are a member of.
        </p>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        )}

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
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {statusFilter || eventTypeFilter
                ? "Try adjusting your filters."
                : "Join some groups to see their events here."}
            </p>
            <Link
              href="/groups"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Browse Groups
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition relative">
                <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900 flex items-center justify-center relative">
                  <span className="text-5xl">{event.eventType === "ONLINE" ? "💻" : "📅"}</span>
                  <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status] || statusColors.PLANNED}`}>
                    {event.status.replace("_", " ")}
                  </span>
                  {/* Three-dots menu for actionable events */}
                  {canShowActions(event) && (
                    <div className="absolute top-3 left-3" ref={openMenuId === event.id ? menuRef : undefined}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                        className="p-1 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-700"
                        title="Event actions"
                      >
                        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openMenuId === event.id && (
                        <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border dark:border-gray-700 z-10">
                          {/* Edit - go to group page */}
                          <Link
                            href={`/groups/${event.group.id}?tab=upcoming`}
                            className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <span>✏️</span> Edit
                          </Link>
                          {/* Start action - for PLANNED only */}
                          {event.status === "PLANNED" && (
                            <button
                              onClick={() => { handleEventStatusChange(event, "IN_PROGRESS"); setOpenMenuId(null) }}
                              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <span>▶️</span> Start
                            </button>
                          )}
                          {/* Complete action - for IN_PROGRESS only */}
                          {event.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => { handleEventStatusChange(event, "COMPLETED"); setOpenMenuId(null) }}
                              className="w-full text-left px-4 py-2 text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <span>✅</span> Complete
                            </button>
                          )}
                          {/* Cancel action */}
                          <button
                            onClick={() => { handleEventStatusChange(event, "CANCELLED"); setOpenMenuId(null) }}
                            className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                          >
                            <span>❌</span> Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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

