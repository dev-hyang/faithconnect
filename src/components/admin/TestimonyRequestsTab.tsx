"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Testimony {
  id: string
  title: string
  description: string
  status: string
  adminComment: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; fullName: string | null; email: string }
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
}

export default function TestimonyRequestsTab() {
  const { data: session } = useSession()
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTestimony, setSelectedTestimony] = useState<Testimony | null>(null)
  const [adminComment, setAdminComment] = useState("")
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchTestimonies()
  }, [])

  const fetchTestimonies = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/testimonies?status=PENDING_APPROVAL")
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
        body: JSON.stringify({ id: selectedTestimony.id, status: action, adminComment }),
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

  const isOwnTestimony = (testimony: Testimony) => testimony.user.id === session?.user?.id

  if (loading) {
    return <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pending Testimony Requests</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {testimonies.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No pending testimony requests</p>
      ) : (
        <div className="space-y-4">
          {testimonies.map((testimony) => (
            <div key={testimony.id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{testimony.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[testimony.status]}`}>
                      {testimony.status.replace("_", " ")}
                    </span>
                    {isOwnTestimony(testimony) && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">(Your testimony)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">By {testimony.user.fullName || testimony.user.email}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{testimony.description}</p>
                </div>
                <button
                  onClick={() => { setSelectedTestimony(testimony); setAdminComment("") }}
                  className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isOwnTestimony(testimony) ? "View" : "Review"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedTestimony && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTestimony.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">By {selectedTestimony.user.fullName || selectedTestimony.user.email}</p>
                </div>
                <button onClick={() => setSelectedTestimony(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Testimony</p>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedTestimony.description}</p>
              </div>
              {isOwnTestimony(selectedTestimony) ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                    ⚠️ You cannot review your own testimony. Another admin must review this.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Comment</label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Leave a comment for the user..."
                    />
                  </div>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

