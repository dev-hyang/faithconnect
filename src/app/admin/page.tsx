"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({ users: 0, groups: 0, pendingRequests: 0 })

  useEffect(() => {
    if (status === "loading") return
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/")
      return
    }
    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/groups"),
      ])
      const usersData = await usersRes.json()
      const groupsData = await groupsRes.json()
      setStats({
        users: usersData.users?.length || 0,
        groups: groupsData.groups?.length || 0,
        pendingRequests: 0,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your church community</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Fellowship Groups</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.groups}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition group">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition">User Management</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">View, activate, or deactivate user accounts</p>
          </Link>

          <Link href="/groups" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition group">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition">Manage Groups</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Create, edit, and manage fellowship groups</p>
          </Link>

          <Link href="/admin/requests" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition group">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition">Join Requests</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Review and approve group join requests</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

