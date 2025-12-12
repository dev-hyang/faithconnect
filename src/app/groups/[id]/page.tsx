"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Member {
  id: string
  userId: string
  role: string
  user: { id: string; fullName: string | null; email: string; image: string | null }
}

interface GroupEvent {
  id: string
  title: string
  description: string | null
  eventTime: string
  eventType: string
  location: string | null
  status: string
}

interface Group {
  id: string
  name: string
  description: string | null
  visibility: string
  scheduleType: string
  scheduleDetails: string | null
  imageUrl: string | null
  maxMembers: number
  createdAt: string
  createdById: string
  createdBy: { id: string; fullName: string | null; email: string }
  members: Member[]
  leaders: Member[]
  regularMembers: Member[]
  events: GroupEvent[]
  inProgressEvents: GroupEvent[]
  upcomingEvents: GroupEvent[]
  historyEvents: GroupEvent[]
  _count: { members: number; events: number }
}

type TabType = "members" | "inprogress" | "upcoming" | "history"

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", description: "", visibility: "", scheduleType: "", scheduleDetails: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [requestingJoin, setRequestingJoin] = useState(false)
  const [joinMessage, setJoinMessage] = useState("")
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("members")

  useEffect(() => {
    fetchGroup()
  }, [id])

  const fetchGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${id}`)
      const data = await response.json()
      if (response.ok) {
        setGroup(data.group)
        setEditForm({
          name: data.group.name,
          description: data.group.description || "",
          visibility: data.group.visibility || "PUBLIC",
          scheduleType: data.group.scheduleType || "ADHOC",
          scheduleDetails: data.group.scheduleDetails || ""
        })
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load group" })
    } finally {
      setLoading(false)
    }
  }

  const isLeader = group?.leaders?.some((m) => m.userId === session?.user?.id)
  const isMember = group?.members?.some((m) => m.userId === session?.user?.id)
  const isAdmin = session?.user?.role === "ADMIN"
  const canEdit = isLeader || isAdmin
  const canDelete = isAdmin
  const canViewMembers = isMember || isAdmin

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
              <EditGroupForm
                editForm={editForm}
                setEditForm={setEditForm}
                onSubmit={handleUpdate}
                onCancel={() => setEditing(false)}
                saving={saving}
              />
            ) : (
              <>
                <GroupHeader
                  group={group}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  onEdit={() => setEditing(true)}
                  onDelete={handleDelete}
                />

                {/* Join Request Section for non-members */}
                {session?.user && !isMember && !isAdmin && (
                  <JoinRequestSection
                    hasPendingRequest={hasPendingRequest}
                    joinMessage={joinMessage}
                    setJoinMessage={setJoinMessage}
                    onJoinRequest={handleJoinRequest}
                    requestingJoin={requestingJoin}
                  />
                )}

                {/* Tabs */}
                <div className="border-t dark:border-gray-700 pt-6">
                  <div className="flex gap-1 mb-6 border-b dark:border-gray-700">
                    {[
                      { key: "members" as TabType, label: "Members", count: group.members?.length || 0 },
                      { key: "inprogress" as TabType, label: "In Progress", count: group.inProgressEvents?.length || 0 },
                      { key: "upcoming" as TabType, label: "Upcoming", count: group.upcomingEvents?.length || 0 },
                      { key: "history" as TabType, label: "History", count: group.historyEvents?.length || 0 },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                          activeTab === tab.key
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                      >
                        {tab.label} ({tab.count})
                        {activeTab === tab.key && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === "members" && (
                    <MembersTab members={group.members} leaders={group.leaders} canViewMembers={canViewMembers} />
                  )}
                  {activeTab === "inprogress" && (
                    <EventsTab events={group.inProgressEvents} emptyMessage="No events in progress" />
                  )}
                  {activeTab === "upcoming" && (
                    <EventsTab events={group.upcomingEvents} emptyMessage="No upcoming events" />
                  )}
                  {activeTab === "history" && (
                    <EventsTab events={group.historyEvents} emptyMessage="No past events" />
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

// Sub-components

function VisibilityBadge({ visibility }: { visibility: string }) {
  const styles: Record<string, string> = {
    PUBLIC: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    INTERNAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PRIVATE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  const icons: Record<string, string> = { PUBLIC: "🌐", INTERNAL: "🏠", PRIVATE: "🔒" }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[visibility] || styles.PUBLIC}`}>
      {icons[visibility]} {visibility}
    </span>
  )
}

function GroupHeader({ group, canEdit, canDelete, onEdit, onDelete }: {
  group: Group; canEdit: boolean; canDelete: boolean; onEdit: () => void; onDelete: () => void
}) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          <VisibilityBadge visibility={group.visibility} />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-3">{group.description || "No description"}</p>
        {group.scheduleDetails && (
          <p className="text-blue-600 dark:text-blue-400 mb-2">
            📅 {group.scheduleType === "RECURRING" ? "🔄 " : ""}{group.scheduleDetails}
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
          <span>👥 {group.members?.length || 0}/{group.maxMembers} members</span>
          <span>📅 {group.events?.length || 0} events</span>
          {group.leaders?.length > 0 && (
            <span>👤 {group.leaders.length === 1
              ? `Leader: ${group.leaders[0].user.fullName || group.leaders[0].user.email}`
              : `${group.leaders.length} leaders`}
            </span>
          )}
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">Edit</button>
          {canDelete && <button onClick={onDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Delete</button>}
        </div>
      )}
    </div>
  )
}

function EditGroupForm({ editForm, setEditForm, onSubmit, onCancel, saving }: {
  editForm: { name: string; description: string; visibility: string; scheduleType: string; scheduleDetails: string }
  setEditForm: (form: typeof editForm) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  saving: boolean
}) {
  const inputClass = "w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className={`${inputClass} text-2xl font-bold`} placeholder="Group Name" />
      <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className={inputClass} placeholder="Description" />
      <select value={editForm.visibility} onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })} className={inputClass}>
        <option value="PUBLIC">🌐 Public</option>
        <option value="INTERNAL">🏠 Internal</option>
        <option value="PRIVATE">🔒 Private</option>
      </select>
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" name="scheduleType" value="ADHOC" checked={editForm.scheduleType === "ADHOC"} onChange={(e) => setEditForm({ ...editForm, scheduleType: e.target.value })} />
          <span className="text-gray-700 dark:text-gray-300">Ad-hoc</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="scheduleType" value="RECURRING" checked={editForm.scheduleType === "RECURRING"} onChange={(e) => setEditForm({ ...editForm, scheduleType: e.target.value })} />
          <span className="text-gray-700 dark:text-gray-300">Recurring</span>
        </label>
      </div>
      <input type="text" value={editForm.scheduleDetails} onChange={(e) => setEditForm({ ...editForm, scheduleDetails: e.target.value })} className={inputClass} placeholder="Schedule details" />
      <div className="flex gap-4">
        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        <button type="button" onClick={onCancel} className="px-6 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-300">Cancel</button>
      </div>
    </form>
  )
}

function JoinRequestSection({ hasPendingRequest, joinMessage, setJoinMessage, onJoinRequest, requestingJoin }: {
  hasPendingRequest: boolean; joinMessage: string; setJoinMessage: (msg: string) => void; onJoinRequest: () => void; requestingJoin: boolean
}) {
  return (
    <div className="border-t dark:border-gray-700 pt-6 mb-6">
      {hasPendingRequest ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-yellow-700 dark:text-yellow-300">
          ⏳ Your join request is pending approval
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Want to join this group?</h4>
          <textarea value={joinMessage} onChange={(e) => setJoinMessage(e.target.value)} placeholder="Add a message (optional)" rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white mb-3" />
          <button onClick={onJoinRequest} disabled={requestingJoin} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {requestingJoin ? "Submitting..." : "Request to Join"}
          </button>
        </div>
      )}
    </div>
  )
}

function MembersTab({ members, leaders, canViewMembers }: { members: Member[]; leaders: Member[]; canViewMembers: boolean }) {
  if (!canViewMembers) {
    return <p className="text-gray-500 dark:text-gray-400 italic">Join this group to see member details</p>
  }
  return (
    <div className="space-y-6">
      {leaders?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Leaders ({leaders.length})</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {leaders.map((member) => <MemberCard key={member.id} member={member} />)}
          </div>
        </div>
      )}
      {members?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Members ({members.length - (leaders?.length || 0)})</h4>
          <div className="grid md:grid-cols-2 gap-3">
            {members.filter(m => m.role !== "LEADER").map((member) => <MemberCard key={member.id} member={member} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <span className="font-semibold text-blue-600 dark:text-blue-400">{member.user.fullName?.[0] || member.user.email[0].toUpperCase()}</span>
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{member.user.fullName || member.user.email}</p>
        <p className="text-sm text-gray-500 capitalize">{member.role.toLowerCase()}</p>
      </div>
    </div>
  )
}

function EventsTab({ events, emptyMessage }: { events: GroupEvent[]; emptyMessage: string }) {
  if (!events || events.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">{emptyMessage}</p>
  }
  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status] || statusColors.PLANNED}`}>
              {event.status.replace("_", " ")}
            </span>
          </div>
          {event.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{event.description}</p>}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>📅 {new Date(event.eventTime).toLocaleString()}</span>
            <span>{event.eventType === "ONLINE" ? "💻 Online" : "📍 " + (event.location || "In-person")}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

