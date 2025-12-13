"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Leader {
  id: string
  fullName: string | null
  email: string
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
  createdBy: { id: string; fullName: string | null; email: string }
  leader: Leader | null
  leaders: Leader[]
  _count: { members: number; events: number }
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

// Helper to truncate description at 200 characters
function truncateDescription(desc: string | null, maxLength = 200): { text: string; isTruncated: boolean } {
  if (!desc) return { text: "No description available", isTruncated: false }
  if (desc.length <= maxLength) return { text: desc, isTruncated: false }
  return { text: desc.substring(0, maxLength) + "...", isTruncated: true }
}

// Helper to get visibility badge
function VisibilityBadge({ visibility }: { visibility: string }) {
  const styles: Record<string, string> = {
    PUBLIC: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    INTERNAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PRIVATE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }
  const icons: Record<string, string> = {
    PUBLIC: "🌐",
    INTERNAL: "🏠",
    PRIVATE: "🔒",
  }
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[visibility] || styles.PUBLIC}`}>
      {icons[visibility]} {visibility}
    </span>
  )
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
            {groups.map((group) => {
              const { text: descText, isTruncated } = truncateDescription(group.description)
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center relative">
                    {group.imageUrl ? (
                      <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-6xl">👥</span>
                    )}
                    <div className="absolute top-3 right-3 flex flex-wrap gap-1 justify-end max-w-[70%]">
                      <VisibilityBadge visibility={group.visibility} />
                      <GenderBadge gender={group.gender} />
                      <AgeBadge minAge={group.minAge} maxAge={group.maxAge} />
                      <MarriedOnlyBadge marriedOnly={group.marriedOnly} />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{group.name}</h3>
                    <div className="relative">
                      <p
                        className="text-gray-600 dark:text-gray-400 text-sm mb-3"
                        title={isTruncated ? group.description || undefined : undefined}
                      >
                        {descText}
                      </p>
                    </div>
                    {group.scheduleDetails && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                        📅 {group.scheduleType === "RECURRING" ? "🔄 " : ""}{group.scheduleDetails}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>👥 {group._count.members}/{group.maxMembers}</span>
                      <span className="truncate ml-2">
                        👤 {group.leaders.length > 1
                          ? `${group.leaders.length} leaders`
                          : group.leader?.fullName || group.createdBy.fullName || "N/A"}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
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
  const [visibility, setVisibility] = useState("PUBLIC")
  const [scheduleType, setScheduleType] = useState("ADHOC")
  const [scheduleDetails, setScheduleDetails] = useState("")
  const [maxMembers, setMaxMembers] = useState(10)
  const [maxLeaders, setMaxLeaders] = useState(10)
  const [gender, setGender] = useState("ALL")
  const [hasAgeLimitation, setHasAgeLimitation] = useState(false)
  const [minAge, setMinAge] = useState<number | "">("")
  const [maxAge, setMaxAge] = useState<number | "">("")
  const [marriedOnly, setMarriedOnly] = useState(false)
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
        body: JSON.stringify({
          name,
          description,
          visibility,
          scheduleType,
          scheduleDetails: scheduleDetails || null,
          maxMembers,
          maxLeaders,
          gender,
          minAge: hasAgeLimitation && minAge !== "" ? minAge : null,
          maxAge: hasAgeLimitation && maxAge !== "" ? maxAge : null,
          marriedOnly,
        }),
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

  const inputClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
  const selectClass = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none text-sm"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg my-2 sm:my-4 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Create Fellowship Group</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition" aria-label="Close">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && <div className="p-2 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Enter group name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} placeholder="Describe your group" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className={selectClass}>
                  <option value="ALL">👥 All</option>
                  <option value="FEMALE">♀️ Female Only</option>
                  <option value="MALE">♂️ Male Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Members (3-20)</label>
                <input type="number" min={3} max={20} value={maxMembers} onChange={(e) => setMaxMembers(Math.min(20, Math.max(3, parseInt(e.target.value) || 10)))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Leaders (3-20)</label>
                <input type="number" min={3} max={20} value={maxLeaders} onChange={(e) => setMaxLeaders(Math.min(20, Math.max(3, parseInt(e.target.value) || 10)))} className={inputClass} />
              </div>
            </div>

            {/* Age Limitation */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasAgeLimitation} onChange={(e) => setHasAgeLimitation(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🎂 Has Age Limitation</span>
              </label>
              {hasAgeLimitation && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Min Age (0-120)</label>
                    <input type="number" min={0} max={120} value={minAge} onChange={(e) => setMinAge(e.target.value === "" ? "" : Math.min(120, Math.max(0, parseInt(e.target.value) || 0)))} className={inputClass} placeholder="e.g., 18" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max Age (0-120)</label>
                    <input type="number" min={0} max={120} value={maxAge} onChange={(e) => setMaxAge(e.target.value === "" ? "" : Math.min(120, Math.max(0, parseInt(e.target.value) || 0)))} className={inputClass} placeholder="e.g., 30" />
                  </div>
                </div>
              )}
            </div>

            {/* Married Only */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={marriedOnly} onChange={(e) => setMarriedOnly(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">💍 Married Couples Only</span>
              </label>
              {marriedOnly && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">Only users with MARRIED status can join this group.</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
              <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className={selectClass}>
                <option value="PUBLIC">🌐 Public - Visible to everyone</option>
                <option value="INTERNAL">🏠 Internal - Members only</option>
                <option value="PRIVATE">🔒 Private - Admins only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scheduleType" value="ADHOC" checked={scheduleType === "ADHOC"} onChange={(e) => setScheduleType(e.target.value)} className="text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Ad-hoc</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="scheduleType" value="RECURRING" checked={scheduleType === "RECURRING"} onChange={(e) => setScheduleType(e.target.value)} className="text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Recurring</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {scheduleType === "RECURRING" ? "Meeting Schedule" : "Schedule Details"}
              </label>
              <input type="text" value={scheduleDetails} onChange={(e) => setScheduleDetails(e.target.value)} className={inputClass} placeholder={scheduleType === "RECURRING" ? "e.g., Every Friday 7:00 PM" : "e.g., Meets as needed"} />
            </div>

            <div className="flex gap-3 pt-3">
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 text-sm">{loading ? "Creating..." : "Create Group"}</button>
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

