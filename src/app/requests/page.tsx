"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import MembershipRequestModal from "@/components/requests/MembershipRequestModal"
import RequestDetailsModal from "@/components/requests/RequestDetailsModal"

interface UserRequest {
  id: string
  category: string
  requestType: string
  title: string
  status: string
  reason: string | null
  testimony: string | null
  previousChurch: string | null
  targetChurch: string | null
  groupName: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
}

export default function MyRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (status === "authenticated") {
      fetchRequests()
    }
  }, [status, router])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/user/requests")
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return
    try {
      const response = await fetch(`/api/user/requests?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchRequests()
      }
    } catch (error) {
      console.error("Failed to delete request:", error)
    }
  }

  const hasPendingMembershipRequest = requests.some(
    (r) => r.category === "MEMBERSHIP" && ["INITIAL", "SUBMITTED"].includes(r.status)
  )

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      INITIAL: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      DECLINED: "bg-red-100 text-red-700",
    }
    return styles[status] || "bg-gray-100 text-gray-700"
  }

  const getCategoryBadge = (category: string) => {
    return category === "MEMBERSHIP" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Requests</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your membership and group requests</p>
            </div>
            <button
              onClick={() => setShowMembershipModal(true)}
              disabled={hasPendingMembershipRequest}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                hasPendingMembershipRequest
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Apply for Membership
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No requests yet. Click the button above to apply for membership.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Title</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryBadge(req.category)}`}>{req.category}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{req.title}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(req.status)}`}>{req.status}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedRequest(req); setShowDetailsModal(true) }} className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                          {req.status === "INITIAL" && (
                            <>
                              <button onClick={() => { setSelectedRequest(req); setShowDetailsModal(true) }} className="text-yellow-600 hover:text-yellow-800 text-sm">Edit</button>
                              <button onClick={() => handleDelete(req.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showMembershipModal && (
        <MembershipRequestModal onClose={() => setShowMembershipModal(false)} onSuccess={() => { setShowMembershipModal(false); fetchRequests() }} />
      )}

      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal request={selectedRequest} onClose={() => { setShowDetailsModal(false); setSelectedRequest(null) }} onUpdate={() => { setShowDetailsModal(false); setSelectedRequest(null); fetchRequests() }} />
      )}
    </div>
  )
}

