"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  fullName: string | null
  role: string
  image: string | null
  createdAt: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  isBaptized: boolean
  whenBaptized: string | null
  marriedStatus: string | null
  spouseGender: string | null
  ministryRole: string | null
  responsibility: string | null
  officePhone: string | null
}

interface FormData {
  email: string
  fullName: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  isBaptized: boolean
  whenBaptized: string
  marriedStatus: string
  spouseGender: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const MARRIED_STATUS_OPTIONS = ["SINGLE", "MARRIED", "WIDOWED", "DIVORCED"]
const SPOUSE_GENDER_OPTIONS = ["MALE", "FEMALE"]

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [formData, setFormData] = useState<FormData>({
    email: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    isBaptized: false,
    whenBaptized: "",
    marriedStatus: "",
    spouseGender: "",
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
          phone: data.user.phone || "",
          address: data.user.address || "",
          city: data.user.city || "",
          state: data.user.state || "",
          zipCode: data.user.zipCode || "",
          isBaptized: data.user.isBaptized || false,
          whenBaptized: data.user.whenBaptized ? new Date(data.user.whenBaptized).toISOString().split("T")[0] : "",
          marriedStatus: data.user.marriedStatus || "",
          spouseGender: data.user.spouseGender || "",
        }))
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: "", text: "" })

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      return
    }

    if (formData.marriedStatus === "MARRIED" && !formData.spouseGender) {
      setMessage({ type: "error", text: "Spouse gender is required when married" })
      return
    }

    setSaving(true)

    try {
      const updateData: Record<string, string | boolean | null> = {
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        isBaptized: formData.isBaptized,
        whenBaptized: formData.whenBaptized || null,
        marriedStatus: formData.marriedStatus || null,
        spouseGender: formData.marriedStatus === "MARRIED" ? formData.spouseGender : null,
        currentMarriedStatus: profile?.marriedStatus || null,
        currentSpouseGender: profile?.spouseGender || null,
      }

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

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            {!editing && (
              <button onClick={() => setEditing(true)} className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition">
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
              {/* Basic Info */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email *</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              {/* Contact Info */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pt-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone</label>
                  <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input name="address" type="text" value={formData.address} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input name="city" type="text" value={formData.city} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input name="state" type="text" value={formData.state} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Zip Code</label>
                  <input name="zipCode" type="text" value={formData.zipCode} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              {/* Faith Info */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pt-4">Faith Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input name="isBaptized" type="checkbox" checked={formData.isBaptized} onChange={handleChange} className="w-5 h-5 rounded border-gray-300" />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">I have been baptized</label>
                </div>
                {formData.isBaptized && (
                  <div>
                    <label className={labelClass}>When Baptized</label>
                    <input name="whenBaptized" type="date" value={formData.whenBaptized} onChange={handleChange} className={inputClass} />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Married Status</label>
                  <select name="marriedStatus" value={formData.marriedStatus} onChange={handleChange} className={inputClass}>
                    <option value="">-- Select --</option>
                    {MARRIED_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {formData.marriedStatus === "MARRIED" && (
                  <div>
                    <label className={labelClass}>Spouse Gender *</label>
                    <select name="spouseGender" value={formData.spouseGender} onChange={handleChange} required className={inputClass}>
                      <option value="">-- Select --</option>
                      {SPOUSE_GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Password Change */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white pt-4">Change Password (optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Current Password</label>
                  <input name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>New Password</label>
                  <input name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profile?.fullName?.[0] || profile?.email[0].toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profile?.fullName || "No name set"}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{profile?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${profile?.role === "ADMIN" ? "bg-purple-100 text-purple-700" : profile?.role === "MEMBER" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {profile?.role}
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoItem label="Phone" value={profile?.phone} />
                  <InfoItem label="Address" value={profile?.address} />
                  <InfoItem label="City" value={profile?.city} />
                  <InfoItem label="State" value={profile?.state} />
                  <InfoItem label="Zip Code" value={profile?.zipCode} />
                </div>
              </div>

              {/* Faith Info */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Faith Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoItem label="Baptized" value={profile?.isBaptized ? "Yes" : "No"} />
                  {profile?.isBaptized && <InfoItem label="When Baptized" value={profile?.whenBaptized ? new Date(profile.whenBaptized).toLocaleDateString() : null} />}
                  <InfoItem label="Married Status" value={profile?.marriedStatus} />
                  {profile?.marriedStatus === "MARRIED" && <InfoItem label="Spouse Gender" value={profile?.spouseGender} />}
                </div>
              </div>

              {/* Account Info */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : null} />
                  <InfoItem label="Role" value={profile?.role} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* My Requests Panel - for GUEST and MEMBER users */}
        {(profile?.role === "GUEST" || profile?.role === "MEMBER") && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">📝 My Requests</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  {profile?.role === "GUEST"
                    ? "Apply for membership or manage your requests"
                    : "View your request history"}
                </p>
              </div>
              <Link href="/requests" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                View Requests
              </Link>
            </div>
          </div>
        )}

        {/* Admin Dashboard Link - for ADMIN users */}
        {profile?.role === "ADMIN" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">📋 Admin Dashboard</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage membership requests, users, and more</p>
              </div>
              <Link href="/admin/dashboard" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white">{value || "-"}</p>
    </div>
  )
}
