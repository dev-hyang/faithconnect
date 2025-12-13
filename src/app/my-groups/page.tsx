"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface GroupMembership {
  id: string
  role: string
  joinedAt: string
  group: {
    id: string
    name: string
    description: string | null
    visibility: string
    gender: string
    imageUrl: string | null
    scheduleType: string
    scheduleDetails: string | null
    _count: { members: number; events: number }
  }
}

export default function MyGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [memberships, setMemberships] = useState<GroupMembership[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (status === "authenticated") {
      fetchMemberships()
    }
  }, [status, router])

  const fetchMemberships = async () => {
    try {
      const response = await fetch("/api/user/groups")
      const data = await response.json()
      if (response.ok) {
        setMemberships(data.memberships || [])
      }
    } catch (error) {
      console.error("Failed to fetch memberships:", error)
    } finally {
      setLoading(false)
    }
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Groups</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Groups you have joined</p>
            </div>
            <Link href="/groups" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
              Browse Groups
            </Link>
          </div>

          {memberships.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven&apos;t joined any groups yet.</p>
              <Link href="/groups" className="text-blue-600 hover:text-blue-800">Browse available groups →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memberships.map((membership) => (
                <Link
                  key={membership.id}
                  href={`/groups/${membership.group.id}`}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{membership.group.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${membership.role === "LEADER" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                      {membership.role}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {membership.group.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>👥 {membership.group._count.members} members</span>
                    <span>📅 {membership.group._count.events} events</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Joined: {new Date(membership.joinedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

