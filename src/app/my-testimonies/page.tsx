"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Testimony {
  id: string
  title: string
  description: string
  status: string
  adminComment: string | null
  createdAt: string
  updatedAt: string
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
]

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
}

export default function MyTestimoniesPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTestimony, setEditingTestimony] = useState<Testimony | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openMenuId])

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/auth/login")
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === "authenticated") fetchTestimonies()
  }, [authStatus, statusFilter])

  const fetchTestimonies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/user/testimonies?${params.toString()}`)
      const data = await res.json()
      setTestimonies(data.testimonies || [])
    } catch (error) {
      console.error("Failed to fetch testimonies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (testimony: Testimony, action: string) => {
    const actionLabels: Record<string, string> = { submit: "submit for approval", cancel: "cancel" }
    const label = actionLabels[action] || action
    if (!confirm(`Are you sure you want to ${label} this testimony?`)) return

    try {
      const response = await fetch("/api/user/testimonies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testimony.id, action }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: `Testimony ${action === "submit" ? "submitted" : "cancelled"} successfully` })
        fetchTestimonies()
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: `Failed to ${action} testimony` })
    }
    setOpenMenuId(null)
  }

  const handleDelete = async (testimony: Testimony) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return
    try {
      const res = await fetch(`/api/user/testimonies?id=${testimony.id}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: "Testimony deleted" })
        fetchTestimonies()
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete testimony" })
    }
    setOpenMenuId(null)
  }

  const canEdit = (status: string) => ["DRAFT", "REJECTED", "CANCELLED"].includes(status)
  const canSubmit = (status: string) => ["DRAFT", "REJECTED", "CANCELLED"].includes(status)
  const canCancel = (status: string) => ["DRAFT", "PENDING_APPROVAL", "REJECTED"].includes(status)
  const canDelete = (status: string) => ["DRAFT", "CANCELLED"].includes(status)
  const hasActions = (status: string) => canEdit(status) || canSubmit(status) || canCancel(status) || canDelete(status)

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Testimonies</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Share your faith journey with others.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <span>+</span> New Testimony
          </button>
        </div>
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-8">
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
        </div>

        {/* Testimonies List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : testimonies.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">✝️</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No testimonies yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {statusFilter ? "Try adjusting your filter." : "Share your first testimony!"}
            </p>
            {!statusFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Create Testimony
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {testimonies.map((testimony) => (
              <div key={testimony.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{testimony.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[testimony.status]}`}>
                        {testimony.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">{testimony.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Updated: {new Date(testimony.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {testimony.adminComment && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Admin comment:</span> {testimony.adminComment}
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Three-dots menu - only show if there are available actions */}
                  {hasActions(testimony.status) && (
                    <div ref={openMenuId === testimony.id ? menuRef : undefined}>
                      <button
                        onClick={() => setOpenMenuId(openMenuId === testimony.id ? null : testimony.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {openMenuId === testimony.id && (
                        <div className="absolute right-6 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border dark:border-gray-700 z-10">
                          {canEdit(testimony.status) && (
                            <button
                              onClick={() => { setEditingTestimony(testimony); setShowEditModal(true); setOpenMenuId(null) }}
                              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <span>✏️</span> Edit
                            </button>
                          )}
                          {canSubmit(testimony.status) && (
                            <button
                              onClick={() => handleAction(testimony, "submit")}
                              className="w-full text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <span>📤</span> Submit
                            </button>
                          )}
                          {canCancel(testimony.status) && (
                            <button
                              onClick={() => handleAction(testimony, "cancel")}
                              className="w-full text-left px-4 py-2 text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <span>🚫</span> Cancel
                            </button>
                          )}
                          {canDelete(testimony.status) && (
                            <button
                              onClick={() => handleDelete(testimony)}
                              className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                            >
                              <span>🗑️</span> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <TestimonyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchTestimonies(); setMessage({ type: "success", text: "Testimony created!" }) }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingTestimony && (
        <TestimonyModal
          testimony={editingTestimony}
          onClose={() => { setShowEditModal(false); setEditingTestimony(null) }}
          onSuccess={() => { setShowEditModal(false); setEditingTestimony(null); fetchTestimonies(); setMessage({ type: "success", text: "Testimony updated!" }) }}
        />
      )}
    </div>
  )
}

// Testimony Create/Edit Modal Component
function TestimonyModal({ testimony, onClose, onSuccess }: {
  testimony?: Testimony
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState(testimony?.title || "")
  const [description, setDescription] = useState(testimony?.description || "")
  const [submitting, setSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState<"save" | "submit">("save")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent, action: "save" | "submit" = "save") => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required")
      return
    }
    setSubmitting(true)
    setSubmitAction(action)
    setError("")

    try {
      const method = testimony ? "PUT" : "POST"
      const body = testimony
        ? { id: testimony.id, title, description, submitForApproval: action === "submit" }
        : { title, description, submitForApproval: action === "submit" }

      const res = await fetch("/api/user/testimonies", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        onSuccess()
      } else {
        setError(data.error || "Failed to save testimony")
      }
    } catch {
      setError("Failed to save testimony")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {testimony ? "Edit Testimony" : "New Testimony"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Give your testimony a title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="Share your faith story..."
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50">
              {submitting && submitAction === "save" ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, "submit")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {submitting && submitAction === "submit" ? "Submitting..." : "Save & Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

