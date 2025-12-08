"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  fullName: string | null
  role: string
  isActive: boolean
  phone: string | null
  createdAt: string
}

export default function UserManagementTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [processing, setProcessing] = useState(false)
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (roleFilter !== "ALL") params.set("role", roleFilter)
      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !isActive }),
      })
      if (response.ok) {
        fetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error("Failed to update user:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setProcessing(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      })
      if (response.ok) {
        fetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error("Failed to update user role:", error)
    } finally {
      setProcessing(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return u.email.toLowerCase().includes(query) || (u.fullName?.toLowerCase().includes(query) ?? false)
  })

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700",
      MEMBER: "bg-green-100 text-green-700",
      GUEST: "bg-gray-100 text-gray-700",
    }
    return styles[role] || "bg-gray-100 text-gray-700"
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email..." className="px-4 py-2 border rounded-lg flex-1 min-w-[200px]" />
        <div className="flex gap-2">
          {["ALL", "ADMIN", "MEMBER", "GUEST"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${roleFilter === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No users found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Joined</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{user.fullName || "No name"}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(user.role)}`}>{user.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.fullName || "No name"}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select value={selectedUser.role} onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)} disabled={processing} className="w-full px-4 py-2 border rounded-lg">
                  <option value="GUEST">GUEST</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Status</label>
                <button onClick={() => handleToggleActive(selectedUser.id, selectedUser.isActive)} disabled={processing} className={`w-full py-2 rounded-lg font-medium ${selectedUser.isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                  {selectedUser.isActive ? "Deactivate Account" : "Activate Account"}
                </button>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

