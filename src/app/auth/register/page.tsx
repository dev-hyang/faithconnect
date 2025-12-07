"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    isAdmin: false,
    ministryRole: "",
    responsibility: "",
    officePhone: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (!formData.phone || !formData.address) {
      setError("Phone and address are required")
      return
    }

    if (formData.isAdmin) {
      if (!formData.ministryRole || !formData.responsibility || !formData.officePhone) {
        setError("All ministry fields are required for admin registration")
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          isAdmin: formData.isAdmin,
          ministryRole: formData.ministryRole,
          responsibility: formData.responsibility,
          officePhone: formData.officePhone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push("/auth/login?registered=true")
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Join our community today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required className={inputClass} placeholder="John Doe" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="you@example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className={inputClass} placeholder="••••••••" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className={inputClass} placeholder="••••••••" />
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="border-t dark:border-gray-700 pt-5 mt-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required className={inputClass} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} required className={inputClass} placeholder="123 Main St" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="col-span-2 md:col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                <input id="city" name="city" type="text" value={formData.city} onChange={handleChange} className={inputClass} placeholder="City" />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                <input id="state" name="state" type="text" value={formData.state} onChange={handleChange} className={inputClass} placeholder="State" />
              </div>
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP Code</label>
                <input id="zipCode" name="zipCode" type="text" value={formData.zipCode} onChange={handleChange} className={inputClass} placeholder="12345" />
              </div>
            </div>
          </div>

          {/* Admin Registration Section */}
          <div className="border-t dark:border-gray-700 pt-5 mt-5">
            <div className="flex items-center gap-3 mb-4">
              <input id="isAdmin" name="isAdmin" type="checkbox" checked={formData.isAdmin} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Register as Church Admin/Staff
              </label>
            </div>

            {formData.isAdmin && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  Please provide your ministry information. All fields are required for admin registration.
                </p>
                <div>
                  <label htmlFor="ministryRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ministry Role <span className="text-red-500">*</span>
                  </label>
                  <input id="ministryRole" name="ministryRole" type="text" value={formData.ministryRole} onChange={handleChange} className={inputClass} placeholder="e.g., Pastor, Elder, Deacon" />
                </div>
                <div>
                  <label htmlFor="responsibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Responsibility <span className="text-red-500">*</span>
                  </label>
                  <input id="responsibility" name="responsibility" type="text" value={formData.responsibility} onChange={handleChange} className={inputClass} placeholder="e.g., Youth Ministry, Worship Team Lead" />
                </div>
                <div>
                  <label htmlFor="officePhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Office Phone <span className="text-red-500">*</span>
                  </label>
                  <input id="officePhone" name="officePhone" type="tel" value={formData.officePhone} onChange={handleChange} className={inputClass} placeholder="(555) 987-6543" />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

