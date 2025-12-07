"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface JoinRequest {
  id: string
  message: string | null
  status: string
  createdAt: string
  user: { id: string; fullName: string | null; email: string; phone: string | null }
  group: { id: string; name: string }
}

export default function AdminRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/")
      return
    }
    fetchRequests()
  }, [session, status, router])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/requests")
      const data = await response.json()
      if (response.ok) {
        setRequests(data.requests)
      } else {
        setError(data.error)
      }
    } catch {
      setError("Failed to fetch requests")
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async (requestId: string, groupId: string, action: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join-request`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status: action }),
      })
      if (response.ok) {
        setRequests(requests.filter((r) => r.id !== requestId))
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch {
      alert("Failed to process request")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Join Requests</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage group join requests</p>
          </div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">← Back to Admin</Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">{error}</div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No pending join requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{req.user.fullName || req.user.email}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{req.user.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Wants to join: <span className="font-medium text-blue-600">{req.group.name}</span></p>
                    {req.message && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 italic">&quot;{req.message}&quot;</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRequest(req.id, req.group.id, "APPROVED")} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">Approve</button>
                    <button onClick={() => handleRequest(req.id, req.group.id, "REJECTED")} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm">Reject</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

