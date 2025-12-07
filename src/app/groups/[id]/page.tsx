"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Group {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  schedule: string | null
  maxMembers: number
  createdAt: string
  createdById: string
  createdBy: { id: string; fullName: string | null; email: string }
  members: Array<{
    id: string
    userId: string
    role: string
    user: { id: string; fullName: string | null; email: string; image: string | null }
  }>
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", description: "", schedule: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [requestingJoin, setRequestingJoin] = useState(false)
  const [joinMessage, setJoinMessage] = useState("")
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

  useEffect(() => {
    fetchGroup()
  }, [id])

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${id}`)
      const data = await response.json()
      if (response.ok) {
        setGroup(data.group)
        setEditForm({ name: data.group.name, description: data.group.description || "", schedule: data.group.schedule || "" })
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load group" })
    } finally {
      setLoading(false)
    }
  }

  const isCreator = session?.user?.id === group?.createdById
  const isLeader = group?.members.some((m) => m.userId === session?.user?.id && m.role === "LEADER")
  const isMember = group?.members.some((m) => m.userId === session?.user?.id)
  const isAdmin = session?.user?.role === "ADMIN"
  const canEdit = isCreator || isLeader || isAdmin
  const canDelete = isCreator || isAdmin
  const canViewMembers = isMember || isAdmin
  const leader = group?.members.find((m) => m.role === "LEADER")

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const data = await response.json()
      if (response.ok) {
        setGroup((prev) => prev ? { ...prev, ...data.group } : null)
        setEditing(false)
        setMessage({ type: "success", text: "Group updated successfully" })
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update group" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return
    try {
      const response = await fetch(`/api/groups/${id}`, { method: "DELETE" })
      if (response.ok) {
        router.push("/groups")
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete group" })
    }
  }

  const handleJoinRequest = async () => {
    setRequestingJoin(true)
    try {
      const response = await fetch(`/api/groups/${id}/join-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: joinMessage }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: "Join request submitted! Waiting for approval." })
        setHasPendingRequest(true)
        setJoinMessage("")
      } else {
        setMessage({ type: "error", text: data.error })
        if (data.error.includes("pending")) setHasPendingRequest(true)
      }
    } catch {
      setMessage({ type: "error", text: "Failed to submit join request" })
    } finally {
      setRequestingJoin(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Group not found</h2>
          <Link href="/groups" className="text-blue-600 hover:underline">Back to groups</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/groups" className="text-blue-600 hover:underline mb-6 inline-block">← Back to Groups</Link>
        
        {message.text && (
          <div className={`p-3 rounded-lg mb-6 ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
            {group.imageUrl ? <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" /> : <span className="text-8xl">👥</span>}
          </div>

          <div className="p-8">
            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="w-full text-2xl font-bold px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Group Name" />
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Description" />
                <input type="text" value={editForm.schedule} onChange={(e) => setEditForm({ ...editForm, schedule: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Schedule (e.g., Every Sunday 10:00 AM)" />
                <div className="flex gap-4">
                  <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                  <button type="button" onClick={() => setEditing(false)} className="px-6 py-2 border rounded-lg">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{group.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{group.description || "No description"}</p>
                    {group.schedule && <p className="text-blue-600 dark:text-blue-400">📅 {group.schedule}</p>}
                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                      <span>👥 {group.members.length}/{group.maxMembers} members</span>
                      {leader && <span>👤 Leader: {leader.user.fullName || leader.user.email}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button onClick={() => setEditing(true)} className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">Edit</button>
                      {canDelete && <button onClick={handleDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">Delete</button>}
                    </div>
                  )}
                </div>

                {/* Join Request Section for non-members */}
                {session?.user && !isMember && !isAdmin && (
                  <div className="border-t dark:border-gray-700 pt-6 mb-6">
                    {hasPendingRequest ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-700 dark:text-yellow-300">
                        ⏳ Your join request is pending approval
                      </div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Want to join this group?</h4>
                        <textarea value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} placeholder="Add a message (optional)" rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white mb-3" />
                        <button onClick={handleJoinRequest} disabled={requestingJoin} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {requestingJoin ? "Submitting..." : "Request to Join"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Members Section */}
                <div className="border-t dark:border-gray-700 pt-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Members ({group.members.length})</h3>
                  {canViewMembers ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {group.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{member.user.fullName?.[0] || member.user.email[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.user.fullName || member.user.email}</p>
                            <p className="text-sm text-gray-500 capitalize">{member.role.toLowerCase()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">Join this group to see member details</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

