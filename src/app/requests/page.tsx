"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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

interface GroupJoinRequest {
  id: string
  status: string
  message: string | null
  createdAt: string
  group: {
    id: string
    name: string
    description: string | null
    visibility: string
    imageUrl: string | null
  }
}

interface GroupInvitation {
  id: string
  status: string
  message: string | null
  createdAt: string
  group: {
    id: string
    name: string
    description: string | null
    visibility: string
    imageUrl: string | null
  }
  invitedBy: {
    id: string
    fullName: string | null
    email: string
  }
}

export default function MyRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [groupRequests, setGroupRequests] = useState<GroupJoinRequest[]>([])
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (status === "authenticated") {
      fetchRequests()
      fetchGroupRequests()
      fetchGroupInvitations()
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

  const fetchGroupRequests = async () => {
    try {
      const response = await fetch("/api/user/group-requests")
      const data = await response.json()
      if (response.ok) {
        setGroupRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Failed to fetch group requests:", error)
    }
  }

  const fetchGroupInvitations = async () => {
    try {
      const response = await fetch("/api/user/invitations")
      const data = await response.json()
      if (response.ok) {
        setGroupInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error("Failed to fetch group invitations:", error)
    }
  }

  const handleInvitation = async (invitationId: string, action: "accept" | "decline") => {
    setProcessingInvite(invitationId)
    try {
      const response = await fetch("/api/user/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId, action }),
      })
      const data = await response.json()
      if (response.ok) {
        fetchGroupInvitations()
        if (action === "accept") {
          alert(data.message)
        }
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error("Failed to process invitation:", error)
    } finally {
      setProcessingInvite(null)
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
        {/* Back Button */}
        <Link href="/profile" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Profile
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Requests</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your membership and group requests</p>
          </div>

          {/* Pending Group Invitations */}
          {groupInvitations.filter(i => i.status === "PENDING").length > 0 && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">📩 Group Invitations</h3>
              <div className="space-y-2">
                {groupInvitations.filter(i => i.status === "PENDING").map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{inv.group.name}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Invited by {inv.invitedBy.fullName || inv.invitedBy.email}
                      </p>
                      {inv.message && <p className="text-sm text-gray-400 dark:text-gray-500 italic mt-1">&quot;{inv.message}&quot;</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleInvitation(inv.id, "accept")}
                        disabled={processingInvite === inv.id}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingInvite === inv.id ? "..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleInvitation(inv.id, "decline")}
                        disabled={processingInvite === inv.id}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Group Join Requests */}
          {groupRequests.filter(r => r.status === "PENDING").length > 0 && (
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">⏳ Pending Group Join Requests</h3>
              <div className="space-y-2">
                {groupRequests.filter(r => r.status === "PENDING").map((req) => (
                  <div key={req.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{req.group.name}</span>
                      {req.message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{req.message}</p>}
                    </div>
                    <span className="text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && groupRequests.length === 0 && groupInvitations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No requests or invitations yet.</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Membership Requests</h3>
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
          ) : null}

          {/* Group Join Request History */}
          {groupRequests.filter(r => r.status !== "PENDING").length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Group Join Request History</h3>
              <div className="space-y-2">
                {groupRequests.filter(r => r.status !== "PENDING").map((req) => (
                  <div key={req.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{req.group.name}</span>
                      {req.message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{req.message}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${req.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {req.status}
                      </span>
                      <span className="text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Invitation History */}
          {groupInvitations.filter(i => i.status !== "PENDING").length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Group Invitation History</h3>
              <div className="space-y-2">
                {groupInvitations.filter(i => i.status !== "PENDING").map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{inv.group.name}</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Invited by {inv.invitedBy.fullName || inv.invitedBy.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${inv.status === "ACCEPTED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {inv.status}
                      </span>
                      <span className="text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
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

