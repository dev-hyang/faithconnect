"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"

export default function Header() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Prevent hydration mismatch by only rendering auth UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">FaithConnect</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Home
            </Link>
            <Link href="/groups" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Fellowship Groups
            </Link>
            <Link href="/events" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Events
            </Link>
            <Link href="/gallery" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Gallery
            </Link>
            <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition">
              Contact
            </Link>

            {!mounted || status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : session ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {session.user?.name?.[0] || session.user?.email?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{session.user?.name || session.user?.email}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border dark:border-gray-700">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        <span>👤</span> My Profile
                      </span>
                    </Link>
                    {session.user?.role === "ADMIN" ? (
                      <>
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="flex items-center gap-2">
                            <span>📋</span> Admin Dashboard
                          </span>
                        </Link>
                        <Link
                          href="/my-events"
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="flex items-center gap-2">
                            <span>📅</span> My Events
                          </span>
                        </Link>
                      </>
                    ) : (
                      <>
                        {session.user?.role === "MEMBER" && (
                          <>
                            <Link
                              href="/my-groups"
                              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setMenuOpen(false)}
                            >
                              <span className="flex items-center gap-2">
                                <span>👥</span> My Groups
                              </span>
                            </Link>
                            <Link
                              href="/my-events"
                              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() => setMenuOpen(false)}
                            >
                              <span className="flex items-center gap-2">
                                <span>📅</span> My Events
                              </span>
                            </Link>
                          </>
                        )}
                        <Link
                          href="/requests"
                          className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className="flex items-center gap-2">
                            <span>📝</span> My Requests
                          </span>
                        </Link>
                      </>
                    )}
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false) }}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/login" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t dark:border-gray-700">
            <div className="flex flex-col space-y-2">
              <Link href="/" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/groups" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>Fellowship Groups</Link>
              <Link href="/events" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>Events</Link>
              <Link href="/gallery" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>Gallery</Link>
              <Link href="/contact" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>Contact</Link>
              {mounted && session ? (
                <>
                  <Link href="/profile" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>👤 My Profile</Link>
                  {session.user?.role === "ADMIN" ? (
                    <>
                      <Link href="/admin/dashboard" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>📋 Admin Dashboard</Link>
                      <Link href="/my-events" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>📅 My Events</Link>
                    </>
                  ) : (
                    <>
                      {session.user?.role === "MEMBER" && (
                        <>
                          <Link href="/my-groups" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>👥 My Groups</Link>
                          <Link href="/my-events" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>📅 My Events</Link>
                        </>
                      )}
                      <Link href="/requests" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>📝 My Requests</Link>
                    </>
                  )}
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="px-3 py-2 text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Sign Out</button>
                </>
              ) : mounted ? (
                <>
                  <Link href="/auth/login" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>Sign In</Link>
                  <Link href="/auth/register" className="px-3 py-2 text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" onClick={() => setMenuOpen(false)}>Register</Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

