"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  email: string
  fullName: string | null
  role: string
  image: string | null
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      const data = await response.json()
      if (response.ok) {
        setProfile(data.user)
        setFormData((prev) => ({
          ...prev,
          email: data.user.email,
          fullName: data.user.fullName || "",
        }))
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: "", text: "" })

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      return
    }

    setSaving(true)

    try {
      const updateData: Record<string, string> = {}
      if (formData.email !== profile?.email) updateData.email = formData.email
      if (formData.fullName !== profile?.fullName) updateData.fullName = formData.fullName
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error })
        return
      }

      setProfile(data.user)
      setMessage({ type: "success", text: "Profile updated successfully" })
      setEditing(false)
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }))
      await update()
    } catch {
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message.text && (
            <div className={`p-3 rounded-lg mb-6 ${message.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"}`}>
              {message.text}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Change Password (optional)</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <input name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <input name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={() => setEditing(false)} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profile?.fullName?.[0] || profile?.email[0].toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profile?.fullName || "No name set"}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{profile?.role.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="font-medium text-gray-900 dark:text-white">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

