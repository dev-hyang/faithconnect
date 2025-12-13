"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Testimony {
  id: string
  title: string
  description: string
  status: string
  adminComment: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; fullName: string | null; email: string }
  reviewer: { id: string; fullName: string | null } | null
}

const STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "ALL", label: "All Statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
]

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
}

export default function AdminTestimoniesPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL")
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null)
  const [adminComment, setAdminComment] = useState("")
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (authStatus === "loading") return
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/")
      return
    }
    fetchTestimonies()
  }, [session, authStatus, router, statusFilter])

  const fetchTestimonies = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/testimonies?status=${statusFilter}`)
      const data = await res.json()
      setTestimonies(data.testimonies || [])
    } catch (error) {
      console.error("Failed to fetch testimonies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: "PUBLISHED" | "REJECTED") => {
    if (!selectedTestimony) return
    setProcessing(true)

    try {
      const res = await fetch("/api/admin/testimonies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTestimony.id,
          status: action,
          adminComment,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: "success", text: `Testimony ${action === "PUBLISHED" ? "approved" : "rejected"}` })
        setSelectedTestimony(null)
        setAdminComment("")
        fetchTestimonies()
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to process testimony" })
    } finally {
      setProcessing(false)
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Testimony Requests</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage testimony submissions</p>
          </div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">← Back to Admin</Link>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Testimonies List */}
        {testimonies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No testimonies found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testimonies.map((testimony) => (
              <div key={testimony.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{testimony.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[testimony.status]}`}>
                        {testimony.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      By {testimony.user.fullName || testimony.user.email}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">{testimony.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted: {new Date(testimony.updatedAt).toLocaleDateString()}
                    </p>
                    {testimony.adminComment && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Admin comment:</span> {testimony.adminComment}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    {testimony.user.id === session?.user?.id && testimony.status === "PENDING_APPROVAL" && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">Your testimony</span>
                    )}
                    <button
                      onClick={() => { setSelectedTestimony(testimony); setAdminComment(testimony.adminComment || "") }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {testimony.status === "PENDING_APPROVAL" && testimony.user.id !== session?.user?.id ? "Review" : "View"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedTestimony && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTestimony.title}</h2>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${statusColors[selectedTestimony.status]}`}>
                    {selectedTestimony.status.replace("_", " ")}
                  </span>
                </div>
                <button onClick={() => { setSelectedTestimony(null); setAdminComment("") }} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Submitted by</p>
                <p className="text-gray-900 dark:text-white">{selectedTestimony.user.fullName || selectedTestimony.user.email}</p>
                <p className="text-sm text-gray-500">{selectedTestimony.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Testimony</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedTestimony.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admin Comment {selectedTestimony.status !== "PENDING_APPROVAL" && "(already reviewed)"}
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Leave a comment for the user..."
                  disabled={selectedTestimony.status !== "PENDING_APPROVAL"}
                />
              </div>
              {selectedTestimony.status === "PENDING_APPROVAL" && (
                selectedTestimony.user.id === session?.user?.id ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                      ⚠️ You cannot review your own testimony. Another admin must review this.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      onClick={() => handleAction("REJECTED")}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {processing ? "..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleAction("PUBLISHED")}
                      disabled={processing}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      {processing ? "..." : "Approve & Publish"}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

