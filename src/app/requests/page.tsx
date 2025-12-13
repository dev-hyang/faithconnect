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
  reviewComment: string | null
  createdAt: string
  group: {
    id: string
    name: string
    description: string | null
    visibility: string
    imageUrl: string | null
  }
}

interface LeaderRequest extends GroupJoinRequest {
  user: {
    id: string
    fullName: string | null
    email: string
    image: string | null
    gender: string | null
    dateOfBirth: string | null
    marriedStatus: string | null
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

interface Testimony {
  id: string
  title: string
  status: string
  adminComment: string | null
  createdAt: string
}

type CategoryFilter = "ALL" | "MEMBERSHIP" | "GROUP" | "TESTIMONIES"

export default function MyRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<UserRequest[]>([])
  const [groupRequests, setGroupRequests] = useState<GroupJoinRequest[]>([])
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([])
  const [leaderRequests, setLeaderRequests] = useState<LeaderRequest[]>([])
  const [testimonies, setTestimonies] = useState<Testimony[]>([])
  const [loading, setLoading] = useState(true)
  const [showMembershipModal, setShowMembershipModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (status === "authenticated") {
      fetchRequests()
      fetchGroupRequests()
      fetchGroupInvitations()
      fetchLeaderRequests()
      fetchTestimonies()
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

  const fetchLeaderRequests = async () => {
    try {
      const response = await fetch("/api/user/leader-requests")
      const data = await response.json()
      if (response.ok) {
        setLeaderRequests(data.requests || [])
      }
    } catch (error) {
      console.error("Failed to fetch leader requests:", error)
    }
  }

  const fetchTestimonies = async () => {
    try {
      const response = await fetch("/api/user/testimonies")
      const data = await response.json()
      if (response.ok) {
        setTestimonies(data.testimonies || [])
      }
    } catch (error) {
      console.error("Failed to fetch testimonies:", error)
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
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your membership, group, and testimony requests</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(["ALL", "MEMBERSHIP", "GROUP", "TESTIMONIES"] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {cat === "ALL" ? "📋 All" : cat === "MEMBERSHIP" ? "🙋 Membership" : cat === "GROUP" ? "👥 Group" : "✝️ Testimonies"}
              </button>
            ))}
          </div>

          {/* Leader's Incoming Requests (show first) */}
          {(categoryFilter === "ALL" || categoryFilter === "GROUP") && leaderRequests.length > 0 && (
            <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-3">📋 Incoming Group Requests (As Leader)</h3>
              <div className="space-y-3">
                {leaderRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        {req.user.image ? (
                          <img src={req.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <span className="text-blue-600">{(req.user.fullName || req.user.email)[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{req.user.fullName || req.user.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">wants to join <Link href={`/groups/${req.group.id}`} className="text-blue-600 hover:underline">{req.group.name}</Link></p>
                        {req.message && <p className="text-sm text-gray-400 italic mt-1">&quot;{req.message}&quot;</p>}
                      </div>
                    </div>
                    <Link href={`/groups/${req.group.id}`} className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Group Invitations */}
          {(categoryFilter === "ALL" || categoryFilter === "GROUP") && groupInvitations.filter(i => i.status === "PENDING").length > 0 && (
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
          {(categoryFilter === "ALL" || categoryFilter === "GROUP") && groupRequests.filter(r => r.status === "PENDING").length > 0 && (
            <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3">⏳ My Pending Group Join Requests</h3>
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

          {/* Pending Testimonies */}
          {(categoryFilter === "ALL" || categoryFilter === "TESTIMONIES") && testimonies.filter(t => ["DRAFT", "PENDING_APPROVAL"].includes(t.status)).length > 0 && (
            <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">✝️ My Pending Testimonies</h3>
              <div className="space-y-2">
                {testimonies.filter(t => ["DRAFT", "PENDING_APPROVAL"].includes(t.status)).map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{t.title}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        t.status === "DRAFT" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"
                      }`}>{t.status.replace("_", " ")}</span>
                    </div>
                    <Link href="/my-testimonies" className="text-purple-600 hover:text-purple-800 text-sm">View</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membership Requests */}
          {(categoryFilter === "ALL" || categoryFilter === "MEMBERSHIP") && requests.length > 0 && (
            <div className="overflow-x-auto mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🙋 Membership Requests</h3>
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

          {/* Group Join Request History */}
          {(categoryFilter === "ALL" || categoryFilter === "GROUP") && groupRequests.filter(r => r.status !== "PENDING").length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👥 Group Join Request History</h3>
              <div className="space-y-2">
                {groupRequests.filter(r => r.status !== "PENDING").map((req) => (
                  <div key={req.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
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
                    {/* Show rejection comment if rejected */}
                    {req.status === "REJECTED" && req.reviewComment && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-400">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <span className="font-medium">Rejection reason:</span> {req.reviewComment}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Invitation History */}
          {(categoryFilter === "ALL" || categoryFilter === "GROUP") && groupInvitations.filter(i => i.status !== "PENDING").length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📩 Group Invitation History</h3>
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

          {/* Testimony History */}
          {(categoryFilter === "ALL" || categoryFilter === "TESTIMONIES") && testimonies.filter(t => ["PUBLISHED", "REJECTED", "CANCELLED"].includes(t.status)).length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">✝️ Testimony History</h3>
              <div className="space-y-2">
                {testimonies.filter(t => ["PUBLISHED", "REJECTED", "CANCELLED"].includes(t.status)).map((t) => (
                  <div key={t.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          t.status === "PUBLISHED" ? "bg-green-100 text-green-700" :
                          t.status === "REJECTED" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {t.status}
                        </span>
                        <span className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                        <Link href="/my-testimonies" className="text-purple-600 hover:text-purple-800 text-sm">View</Link>
                      </div>
                    </div>
                    {/* Show rejection comment if rejected */}
                    {t.status === "REJECTED" && t.adminComment && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-400">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <span className="font-medium">Rejection reason:</span> {t.adminComment}
                        </p>
                      </div>
                    )}
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

