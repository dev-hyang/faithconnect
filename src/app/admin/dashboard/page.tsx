"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import MembershipRequestsTab from "@/components/admin/MembershipRequestsTab"
import UserManagementTab from "@/components/admin/UserManagementTab"

type TabType = "requests" | "users"

export default function AdminDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("requests")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    if (status === "authenticated") {
      // Check if user is admin
      if (session?.user?.role !== "ADMIN") {
        router.push("/profile")
        return
      }
      setLoading(false)
    }
  }, [status, session, router])

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user?.role !== "ADMIN") {
    return null
  }

  const tabs = [
    { id: "requests" as TabType, label: "Membership Requests", icon: "📋" },
    { id: "users" as TabType, label: "User Management", icon: "👥" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage membership requests and users</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          {activeTab === "requests" && <MembershipRequestsTab />}
          {activeTab === "users" && <UserManagementTab />}
        </div>
      </div>
    </div>
  )
}

