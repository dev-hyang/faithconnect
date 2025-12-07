"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  email: string
  fullName: string | null
  role: string
  isActive: boolean
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  ministryRole: string | null
  responsibility: string | null
  officePhone: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/")
      return
    }
    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users)
      } else {
        setError(data.error)
      }
    } catch {
      setError("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      const data = await response.json()
      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u))
      } else {
        alert(data.error)
      }
    } catch {
      alert("Failed to update user status")
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all registered users</p>
          </div>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">← Back to Admin</Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {user.fullName?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName || "No name"}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === "ADMIN" ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" :
                        user.role === "MEMBER" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.phone || "No phone"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedUser(user)} className="text-blue-600 hover:text-blue-700 text-sm">View</button>
                        <button onClick={() => toggleUserStatus(user.id, user.isActive)} className={`text-sm ${user.isActive ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}`} disabled={session?.user?.id === user.id}>
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h2>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedUser.fullName?.[0] || selectedUser.email[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedUser.fullName || "No name"}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                  <div><p className="text-sm text-gray-500">Role</p><p className="font-medium text-gray-900 dark:text-white">{selectedUser.role}</p></div>
                  <div><p className="text-sm text-gray-500">Status</p><p className={`font-medium ${selectedUser.isActive ? "text-green-600" : "text-red-600"}`}>{selectedUser.isActive ? "Active" : "Inactive"}</p></div>
                  <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-900 dark:text-white">{selectedUser.phone || "N/A"}</p></div>
                  <div><p className="text-sm text-gray-500">Joined</p><p className="font-medium text-gray-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p></div>
                </div>
                <div className="pt-4 border-t dark:border-gray-700">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedUser.address ? `${selectedUser.address}, ${selectedUser.city || ""} ${selectedUser.state || ""} ${selectedUser.zipCode || ""}` : "N/A"}</p>
                </div>
                {selectedUser.role === "ADMIN" && (
                  <div className="pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ministry Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-sm text-gray-500">Ministry Role</p><p className="font-medium text-gray-900 dark:text-white">{selectedUser.ministryRole || "N/A"}</p></div>
                      <div><p className="text-sm text-gray-500">Office Phone</p><p className="font-medium text-gray-900 dark:text-white">{selectedUser.officePhone || "N/A"}</p></div>
                      <div className="col-span-2"><p className="text-sm text-gray-500">Responsibility</p><p className="font-medium text-gray-900 dark:text-white">{selectedUser.responsibility || "N/A"}</p></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t dark:border-gray-700">
                <button onClick={() => { toggleUserStatus(selectedUser.id, selectedUser.isActive); setSelectedUser(null); }} disabled={session?.user?.id === selectedUser.id} className={`flex-1 py-2 px-4 rounded-lg font-medium transition disabled:opacity-50 ${selectedUser.isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>{selectedUser.isActive ? "Deactivate User" : "Activate User"}</button>
                <button onClick={() => setSelectedUser(null)} className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
