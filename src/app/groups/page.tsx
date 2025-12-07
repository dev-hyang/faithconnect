"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Group {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  schedule: string | null
  maxMembers: number
  createdAt: string
  createdBy: { id: string; fullName: string | null; email: string }
  leader: { id: string; fullName: string | null; email: string } | null
  _count: { members: number }
}

export default function GroupsPage() {
  const { data: session } = useSession()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups")
      const data = await response.json()
      if (response.ok) {
        setGroups(data.groups)
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const canCreateGroup = session?.user?.role && session.user.role !== "GUEST"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fellowship Groups</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Join a group to connect with others</p>
          </div>
          {canCreateGroup && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              + Create Group
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No groups yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Be the first to create a fellowship group!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <div className="h-40 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  {group.imageUrl ? (
                    <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">👥</span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{group.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                    {group.description || "No description available"}
                  </p>
                  {group.schedule && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">📅 {group.schedule}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{group._count.members}/{group.maxMembers} members</span>
                    <span>Leader: {group.leader?.fullName || group.createdBy.fullName || "N/A"}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            fetchGroups()
          }}
        />
      )}
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [schedule, setSchedule] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, schedule }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create group")
        return
      }

      onCreated()
    } catch {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Fellowship Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Enter group name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="Describe your group" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Schedule</label>
            <input type="text" value={schedule} onChange={(e) => setSchedule(e.target.value)} className={inputClass} placeholder="e.g., Every Sunday 10:00 AM" />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">{loading ? "Creating..." : "Create Group"}</button>
            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

