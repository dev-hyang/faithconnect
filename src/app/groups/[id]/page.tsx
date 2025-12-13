"use client"

import { useState, useEffect, use, useRef } from "react"
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
  maxLeaders: number
  gender: string
  minAge: number | null
  maxAge: number | null
  marriedOnly: boolean
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
  const [editForm, setEditForm] = useState({ name: "", description: "", visibility: "", scheduleType: "", scheduleDetails: "", maxLeaders: 10, gender: "ALL" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [requestingJoin, setRequestingJoin] = useState(false)
  const [joinMessage, setJoinMessage] = useState("")
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("members")
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<GroupEvent | null>(null)

  useEffect(() => {
    fetchGroup()
    checkPendingRequest()
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
          scheduleDetails: data.group.scheduleDetails || "",
          maxLeaders: data.group.maxLeaders || 10,
          gender: data.group.gender || "ALL"
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

  const checkPendingRequest = async () => {
    try {
      const response = await fetch(`/api/user/group-requests?groupId=${id}`)
      const data = await response.json()
      if (response.ok && data.hasPending) {
        setHasPendingRequest(true)
      }
    } catch {
      // Ignore errors - user might not be logged in
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

  const handleEventStatusChange = async (event: GroupEvent, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      IN_PROGRESS: "start",
      COMPLETED: "complete",
      CANCELLED: "cancel"
    }
    const action = statusLabels[newStatus] || "update"

    if (!confirm(`Are you sure you want to ${action} this event?`)) return

    try {
      const response = await fetch(`/api/groups/${id}/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage({ type: "success", text: `Event ${action}ed successfully` })
        fetchGroup() // Refresh the group data to get updated event lists
      } else {
        setMessage({ type: "error", text: data.error })
      }
    } catch {
      setMessage({ type: "error", text: `Failed to ${action} event` })
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
                  onInvite={() => setShowInviteModal(true)}
                  onCreateEvent={() => setShowCreateEventModal(true)}
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
                    <MembersTab
                      members={group.members}
                      leaders={group.leaders}
                      canViewMembers={canViewMembers}
                    />
                  )}
                  {activeTab === "inprogress" && (
                    <EventsTab
                      events={group.inProgressEvents}
                      emptyMessage="No events in progress"
                      canEdit={canEdit}
                      onEditEvent={(event) => { setEditingEvent(event); setShowEditEventModal(true) }}
                      onCompleteEvent={(event) => handleEventStatusChange(event, "COMPLETED")}
                      onCancelEvent={(event) => handleEventStatusChange(event, "CANCELLED")}
                    />
                  )}
                  {activeTab === "upcoming" && (
                    <EventsTab
                      events={group.upcomingEvents}
                      emptyMessage="No upcoming events"
                      canEdit={canEdit}
                      onEditEvent={(event) => { setEditingEvent(event); setShowEditEventModal(true) }}
                      onStartEvent={(event) => handleEventStatusChange(event, "IN_PROGRESS")}
                      onCancelEvent={(event) => handleEventStatusChange(event, "CANCELLED")}
                    />
                  )}
                  {activeTab === "history" && (
                    <EventsTab
                      events={group.historyEvents}
                      emptyMessage="No past events"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <InviteModal
            groupId={id}
            onClose={() => setShowInviteModal(false)}
            onSuccess={(msg) => {
              setMessage({ type: "success", text: msg })
              setShowInviteModal(false)
            }}
            onError={(msg) => setMessage({ type: "error", text: msg })}
          />
        )}

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <CreateEventModal
            groupId={id}
            onClose={() => setShowCreateEventModal(false)}
            onSuccess={(msg) => {
              setMessage({ type: "success", text: msg })
              setShowCreateEventModal(false)
              fetchGroup()
            }}
            onError={(msg) => setMessage({ type: "error", text: msg })}
          />
        )}

        {/* Edit Event Modal */}
        {showEditEventModal && editingEvent && (
          <EditEventModal
            groupId={id}
            event={editingEvent}
            onClose={() => { setShowEditEventModal(false); setEditingEvent(null) }}
            onSuccess={(msg) => {
              setMessage({ type: "success", text: msg })
              setShowEditEventModal(false)
              setEditingEvent(null)
              fetchGroup()
            }}
            onError={(msg) => setMessage({ type: "error", text: msg })}
          />
        )}
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

function GenderBadge({ gender }: { gender: string }) {
  if (gender === "ALL") return null
  const styles: Record<string, string> = {
    FEMALE: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    MALE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }
  const icons: Record<string, string> = { FEMALE: "♀️", MALE: "♂️" }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[gender]}`}>
      {icons[gender]} {gender}
    </span>
  )
}

function AgeBadge({ minAge, maxAge }: { minAge: number | null; maxAge: number | null }) {
  if (minAge === null && maxAge === null) return null
  let label = ""
  if (minAge !== null && maxAge !== null) {
    label = `${minAge}-${maxAge}`
  } else if (minAge !== null) {
    label = `${minAge}+`
  } else if (maxAge !== null) {
    label = `≤${maxAge}`
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
      🎂 {label}
    </span>
  )
}

function MarriedOnlyBadge({ marriedOnly }: { marriedOnly: boolean }) {
  if (!marriedOnly) return null
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
      💍 Married
    </span>
  )
}

function GroupHeader({ group, canEdit, canDelete, onEdit, onDelete, onInvite, onCreateEvent }: {
  group: Group; canEdit: boolean; canDelete: boolean; onEdit: () => void; onDelete: () => void; onInvite: () => void; onCreateEvent: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          <VisibilityBadge visibility={group.visibility} />
          <GenderBadge gender={group.gender} />
          <AgeBadge minAge={group.minAge} maxAge={group.maxAge} />
          <MarriedOnlyBadge marriedOnly={group.marriedOnly} />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-3">{group.description || "No description"}</p>
        {group.scheduleDetails && (
          <p className="text-blue-600 dark:text-blue-400 mb-2">
            📅 {group.scheduleType === "RECURRING" ? "🔄 " : ""}{group.scheduleDetails}
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
          <span>👥 {group.members?.length || 0}/{group.maxMembers} members</span>
          <span>👑 {group.leaders?.length || 0}/{group.maxLeaders} leaders</span>
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
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            aria-label="Group actions"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border dark:border-gray-700 z-10">
              <button
                onClick={() => { onEdit(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>✏️</span> Edit Group
              </button>
              <button
                onClick={() => { onInvite(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>👤</span> Invite Members
              </button>
              <button
                onClick={() => { onCreateEvent(); setMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <span>📅</span> New Event
              </button>
              {canDelete && (
                <>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <span>🗑️</span> Delete Group
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditGroupForm({ editForm, setEditForm, onSubmit, onCancel, saving }: {
  editForm: { name: string; description: string; visibility: string; scheduleType: string; scheduleDetails: string; maxLeaders: number; gender: string }
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
          <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className={inputClass}>
            <option value="ALL">👥 All</option>
            <option value="FEMALE">♀️ Female Only</option>
            <option value="MALE">♂️ Male Only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Leaders (3-20)</label>
          <input type="number" min={3} max={20} value={editForm.maxLeaders} onChange={(e) => setEditForm({ ...editForm, maxLeaders: Math.min(20, Math.max(3, parseInt(e.target.value) || 10)) })} className={inputClass} />
        </div>
      </div>
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

function MembersTab({ members, leaders, canViewMembers }: {
  members: Member[]; leaders: Member[]; canViewMembers: boolean
}) {
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
        <p className="text-xs text-gray-400 dark:text-gray-500">{member.user.email}</p>
      </div>
    </div>
  )
}

function EventsTab({ events, emptyMessage, canEdit, onEditEvent, onStartEvent, onCompleteEvent, onCancelEvent }: {
  events: GroupEvent[];
  emptyMessage: string;
  canEdit?: boolean;
  onEditEvent?: (event: GroupEvent) => void;
  onStartEvent?: (event: GroupEvent) => void;
  onCompleteEvent?: (event: GroupEvent) => void;
  onCancelEvent?: (event: GroupEvent) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openMenuId])

  if (!events || events.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 italic text-center py-8">{emptyMessage}</p>
  }
  const statusColors: Record<string, string> = {
    PLANNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  const canShowActions = (status: string) => canEdit && (status === "PLANNED" || status === "IN_PROGRESS")

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status] || statusColors.PLANNED}`}>
                {event.status.replace("_", " ")}
              </span>
              {canShowActions(event.status) && (
                <div className="relative" ref={openMenuId === event.id ? menuRef : undefined}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                    className="p-1 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    title="Event actions"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {openMenuId === event.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border dark:border-gray-700 z-10">
                      {/* Edit action - for PLANNED and IN_PROGRESS */}
                      {onEditEvent && (
                        <button
                          onClick={() => { onEditEvent(event); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <span>✏️</span> Edit
                        </button>
                      )}
                      {/* Start action - for PLANNED only */}
                      {event.status === "PLANNED" && onStartEvent && (
                        <button
                          onClick={() => { onStartEvent(event); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <span>▶️</span> Start
                        </button>
                      )}
                      {/* Complete action - for IN_PROGRESS only */}
                      {event.status === "IN_PROGRESS" && onCompleteEvent && (
                        <button
                          onClick={() => { onCompleteEvent(event); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <span>✅</span> Complete
                        </button>
                      )}
                      {/* Cancel action - for PLANNED and IN_PROGRESS */}
                      {onCancelEvent && (
                        <button
                          onClick={() => { onCancelEvent(event); setOpenMenuId(null) }}
                          className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                        >
                          <span>❌</span> Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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

interface SearchUser {
  id: string
  email: string
  fullName: string | null
  image: string | null
  gender: string | null
  dateOfBirth: string | null
  marriedStatus: string | null
}

function InviteModal({ groupId, onClose, onSuccess, onError }: {
  groupId: string
  onClose: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)
  const [inviteMessage, setInviteMessage] = useState("")
  const [statusMessages, setStatusMessages] = useState<string[]>([])

  const handleSearch = async () => {
    if (searchQuery.length < 2) return
    setSearching(true)
    setStatusMessages([])
    try {
      const response = await fetch(`/api/groups/${groupId}/users/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      if (response.ok) {
        setSearchResults(data.users)
        // Build status messages for excluded users
        const messages: string[] = []
        if (data.alreadyMembers?.length > 0) {
          data.alreadyMembers.forEach((u: { email: string; fullName: string | null }) => {
            messages.push(`${u.fullName || u.email} is already a member`)
          })
        }
        if (data.hasPendingInvite?.length > 0) {
          data.hasPendingInvite.forEach((u: { email: string; fullName: string | null }) => {
            messages.push(`${u.fullName || u.email} already has a pending invitation`)
          })
        }
        if (data.hasPendingRequest?.length > 0) {
          data.hasPendingRequest.forEach((u: { email: string; fullName: string | null }) => {
            messages.push(`${u.fullName || u.email} already has a pending join request`)
          })
        }
        setStatusMessages(messages)
      } else {
        onError(data.error)
      }
    } catch {
      onError("Failed to search users")
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = async (userId: string) => {
    setInviting(userId)
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: inviteMessage }),
      })
      const data = await response.json()
      if (response.ok) {
        onSuccess(data.message)
        setSearchResults((prev) => prev.filter((u) => u.id !== userId))
      } else {
        onError(data.error)
      }
    } catch {
      onError("Failed to send invitation")
    } finally {
      setInviting(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invite Member</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by email..."
              className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <button
              onClick={handleSearch}
              disabled={searching || searchQuery.length < 2}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {searching ? "..." : "Search"}
            </button>
          </div>

          {/* Optional Message */}
          <input
            type="text"
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            placeholder="Add a message (optional)"
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />

          {/* Status Messages */}
          {statusMessages.length > 0 && (
            <div className="space-y-1">
              {statusMessages.map((msg, idx) => (
                <p key={idx} className="text-sm text-amber-600 dark:text-amber-400">⚠️ {msg}</p>
              ))}
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && statusMessages.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No users found</p>
            )}
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {user.fullName?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.fullName || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(user.id)}
                  disabled={inviting === user.id}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {inviting === user.id ? "..." : "Invite"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t dark:border-gray-700">
          <button onClick={onClose} className="w-full px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateEventModal({ groupId, onClose, onSuccess, onError }: {
  groupId: string
  onClose: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventTime: "",
    eventType: "OFFLINE",
    location: "",
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.eventTime) {
      onError("Title and event time are required")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (response.ok) {
        onSuccess("Event created successfully")
      } else {
        onError(data.error || "Failed to create event")
      }
    } catch {
      onError("Failed to create event")
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Event</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className={inputClass}
              placeholder="Event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={inputClass}
              placeholder="Event description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date & Time *</label>
            <input
              type="datetime-local"
              value={form.eventTime}
              onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
            <select
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
              className={inputClass}
            >
              <option value="OFFLINE">📍 Offline (In-person)</option>
              <option value="ONLINE">💻 Online</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {form.eventType === "ONLINE" ? "Meeting Link" : "Location"}
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
              placeholder={form.eventType === "ONLINE" ? "https://zoom.us/..." : "123 Church St."}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Event"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function EditEventModal({ groupId, event, onClose, onSuccess, onError }: {
  groupId: string
  event: GroupEvent
  onClose: () => void
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const [form, setForm] = useState({
    title: event.title,
    description: event.description || "",
    eventTime: new Date(event.eventTime).toISOString().slice(0, 16),
    eventType: event.eventType,
    location: event.location || "",
    status: event.status,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.eventTime) {
      onError("Title and event time are required")
      return
    }
    setSaving(true)
    try {
      const response = await fetch(`/api/groups/${groupId}/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (response.ok) {
        onSuccess("Event updated successfully")
      } else {
        onError(data.error || "Failed to update event")
      }
    } catch {
      onError("Failed to update event")
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Event</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className={inputClass}
              placeholder="Event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={inputClass}
              placeholder="Event description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date & Time *</label>
            <input
              type="datetime-local"
              value={form.eventTime}
              onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
              <select
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                className={inputClass}
              >
                <option value="OFFLINE">📍 Offline</option>
                <option value="ONLINE">💻 Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={inputClass}
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {form.eventType === "ONLINE" ? "Meeting Link" : "Location"}
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
              placeholder={form.eventType === "ONLINE" ? "https://zoom.us/..." : "123 Church St."}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
