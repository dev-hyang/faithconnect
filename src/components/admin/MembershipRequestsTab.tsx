"use client"

import { useState, useEffect } from "react"

interface UserRequest {
  id: string
  userId: string
  category: string
  requestType: string
  title: string
  status: string
  reason: string | null
  testimony: string | null
  previousChurch: string | null
  targetChurch: string | null
  createdAt: string
  user: {
    id: string
    email: string
    fullName: string | null
    phone: string | null
  }
}

export default function MembershipRequestsTab() {
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("SUBMITTED")
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/admin/requests?status=${statusFilter}`)
      const data = await response.json()
      if (response.ok) {
        setRequests(data.requests)
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: "APPROVED" | "DECLINED") => {
    if (!selectedRequest) return
    setProcessing(true)

    try {
      const response = await fetch("/api/admin/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: action,
          reviewNote,
        }),
      })

      if (response.ok) {
        setSelectedRequest(null)
        setReviewNote("")
        fetchRequests()
      }
    } catch (error) {
      console.error("Failed to process request:", error)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      INITIAL: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      DECLINED: "bg-red-100 text-red-700",
    }
    return styles[status] || "bg-gray-100 text-gray-700"
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["SUBMITTED", "APPROVED", "DECLINED", "ALL"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No requests found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Request</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{req.user.fullName || "No name"}</p>
                    <p className="text-sm text-gray-500">{req.user.email}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{req.title}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setSelectedRequest(req)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      {req.status === "SUBMITTED" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedRequest.title}</h3>
                  <p className="text-gray-500">From: {selectedRequest.user.fullName || selectedRequest.user.email}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div><strong>Reason:</strong> {selectedRequest.reason || "-"}</div>
              <div><strong>Testimony:</strong><p className="mt-1 whitespace-pre-wrap">{selectedRequest.testimony || "-"}</p></div>
              {selectedRequest.previousChurch && <div><strong>Previous Church:</strong> {selectedRequest.previousChurch}</div>}
              {selectedRequest.status === "SUBMITTED" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Review Note (optional)</label>
                  <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows={3} placeholder="Add a note for the applicant..." />
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              {selectedRequest.status === "SUBMITTED" && (
                <>
                  <button onClick={() => handleAction("DECLINED")} disabled={processing} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">Decline</button>
                  <button onClick={() => handleAction("APPROVED")} disabled={processing} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">Approve</button>
                </>
              )}
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

