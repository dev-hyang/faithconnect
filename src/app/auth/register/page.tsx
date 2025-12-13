"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  validatePassword,
  validatePhone,
  getEmailValidation,
  getPasswordStrength,
  formatPhoneNumber,
  PHONE_FORMAT_HINT,
  EMAIL_FORMAT_HINT,
  PASSWORD_FORMAT_HINT,
} from "@/lib/validation"

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
    // Gender and personal info
    gender: "",
    dateOfBirth: "",
    // Faith info
    isBaptized: false,
    whenBaptized: "",
    marriedStatus: "",
    spouseGender: "",
    // Apply for membership
    applyForMembership: false,
    faithStatement: "",
    attendsRegularly: false,
  })
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked })
    } else if (name === "phone") {
      // Auto-format phone numbers
      setFormData({ ...formData, [name]: formatPhoneNumber(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: "" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const errors: Record<string, string> = {}

    // Email validation
    const emailValidation = getEmailValidation(formData.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.message || "Invalid email"
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.message || "Invalid password"
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    // Phone validation
    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.message || "Invalid phone"
    }

    // Address required
    if (!formData.address) {
      errors.address = "Address is required"
    }

    // Gender is required
    if (!formData.gender) {
      errors.gender = "Gender is required"
    }

    // Spouse gender required if married
    if (formData.marriedStatus === "MARRIED" && !formData.spouseGender) {
      errors.spouseGender = "Spouse gender is required when married"
    }

    // When baptized required if baptized is checked
    if (formData.isBaptized && !formData.whenBaptized) {
      errors.whenBaptized = "Please provide your baptism date"
    }

    // Member application fields
    if (formData.applyForMembership) {
      if (!formData.isBaptized) {
        errors.isBaptized = "Baptism is required for membership"
      }
      if (!formData.faithStatement) {
        errors.faithStatement = "Please share your faith statement"
      }
      if (!formData.attendsRegularly) {
        errors.attendsRegularly = "You must confirm regular attendance"
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError("Please fix the errors below")
      return
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
          gender: formData.gender,
          isBaptized: formData.isBaptized,
          whenBaptized: formData.whenBaptized || null,
          marriedStatus: formData.marriedStatus || null,
          spouseGender: formData.spouseGender || null,
          applyForMembership: formData.applyForMembership,
          faithStatement: formData.faithStatement || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      // If user applied for membership, show appropriate message
      const redirectUrl = formData.applyForMembership
        ? "/auth/login?registered=true&membership=pending"
        : "/auth/login?registered=true"
      router.push(redirectUrl)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
  const selectClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
  const inputErrorClass = "w-full px-4 py-3 border border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
  const hintClass = "text-xs text-gray-500 dark:text-gray-400 mt-1"
  const errorTextClass = "text-xs text-red-500 mt-1"

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }

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
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required className={fieldErrors.email ? inputErrorClass : inputClass} placeholder="you@example.com" />
              {fieldErrors.email ? (
                <p className={errorTextClass}>{fieldErrors.email}</p>
              ) : (
                <p className={hintClass}>{EMAIL_FORMAT_HINT}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required className={fieldErrors.password ? inputErrorClass : inputClass} placeholder="••••••••" />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${strengthColors[passwordStrength.strength]} transition-all`} style={{ width: `${(passwordStrength.score / 6) * 100}%` }} />
                    </div>
                    <span className={`text-xs ${passwordStrength.strength === "weak" ? "text-red-500" : passwordStrength.strength === "medium" ? "text-yellow-500" : "text-green-500"}`}>
                      {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                    </span>
                  </div>
                </div>
              )}
              {fieldErrors.password ? (
                <p className={errorTextClass}>{fieldErrors.password}</p>
              ) : (
                <p className={hintClass}>{PASSWORD_FORMAT_HINT}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required className={fieldErrors.confirmPassword ? inputErrorClass : inputClass} placeholder="••••••••" />
              {fieldErrors.confirmPassword && <p className={errorTextClass}>{fieldErrors.confirmPassword}</p>}
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
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required className={fieldErrors.phone ? inputErrorClass : inputClass} placeholder="(101) 202-0001" />
                {fieldErrors.phone ? (
                  <p className={errorTextClass}>{fieldErrors.phone}</p>
                ) : (
                  <p className={hintClass}>{PHONE_FORMAT_HINT}</p>
                )}
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} required className={fieldErrors.address ? inputErrorClass : inputClass} placeholder="123 Main St" />
                {fieldErrors.address && <p className={errorTextClass}>{fieldErrors.address}</p>}
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

          {/* Personal Info Section */}
          <div className="border-t dark:border-gray-700 pt-5 mt-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required className={fieldErrors.gender ? inputErrorClass : selectClass}>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {fieldErrors.gender && <p className={errorTextClass}>{fieldErrors.gender}</p>}
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth
                </label>
                <input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="marriedStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Married Status
                </label>
                <select id="marriedStatus" name="marriedStatus" value={formData.marriedStatus} onChange={handleChange} className={selectClass}>
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="DIVORCED">Divorced</option>
                </select>
              </div>
            </div>
            {formData.marriedStatus === "MARRIED" && (
              <div className="mt-4">
                <label htmlFor="spouseGender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Spouse Gender <span className="text-red-500">*</span>
                </label>
                <select id="spouseGender" name="spouseGender" value={formData.spouseGender} onChange={handleChange} className={fieldErrors.spouseGender ? inputErrorClass : selectClass}>
                  <option value="">Select Spouse Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
                {fieldErrors.spouseGender && <p className={errorTextClass}>{fieldErrors.spouseGender}</p>}
              </div>
            )}
          </div>

          {/* Faith Info Section */}
          <div className="border-t dark:border-gray-700 pt-5 mt-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Faith Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input id="isBaptized" name="isBaptized" type="checkbox" checked={formData.isBaptized} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="isBaptized" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  I have been baptized
                </label>
              </div>
              {fieldErrors.isBaptized && <p className={errorTextClass}>{fieldErrors.isBaptized}</p>}
              {formData.isBaptized && (
                <div>
                  <label htmlFor="whenBaptized" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    When were you baptized? <span className="text-red-500">*</span>
                  </label>
                  <input id="whenBaptized" name="whenBaptized" type="date" value={formData.whenBaptized} onChange={handleChange} className={fieldErrors.whenBaptized ? inputErrorClass : inputClass} />
                  {fieldErrors.whenBaptized && <p className={errorTextClass}>{fieldErrors.whenBaptized}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Membership Application Section */}
          <div className="border-t dark:border-gray-700 pt-5 mt-5">
            <div className="flex items-center gap-3 mb-4">
              <input id="applyForMembership" name="applyForMembership" type="checkbox" checked={formData.applyForMembership} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label htmlFor="applyForMembership" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Apply for Church Membership
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Check this box if you want to apply for membership. Your application will be reviewed by church administration.
            </p>

            {formData.applyForMembership && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  Please provide your faith statement and confirm your commitment. Your membership request will be sent to the church administration for review.
                </p>
                <div>
                  <label htmlFor="faithStatement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Faith Statement / Testimony <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="faithStatement"
                    name="faithStatement"
                    value={formData.faithStatement}
                    onChange={handleChange}
                    rows={4}
                    className={fieldErrors.faithStatement ? inputErrorClass : inputClass}
                    placeholder="Please share your faith journey, when you accepted Christ, and why you want to become a member of our church..."
                  />
                  {fieldErrors.faithStatement && <p className={errorTextClass}>{fieldErrors.faithStatement}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <input id="attendsRegularly" name="attendsRegularly" type="checkbox" checked={formData.attendsRegularly} onChange={handleChange} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="attendsRegularly" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    I confirm that I attend church services regularly <span className="text-red-500">*</span>
                  </label>
                </div>
                {fieldErrors.attendsRegularly && <p className={errorTextClass}>{fieldErrors.attendsRegularly}</p>}
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

