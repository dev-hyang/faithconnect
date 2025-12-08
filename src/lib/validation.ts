// Validation utilities for user authentication

// Phone format: (XXX) XXX-XXXX
export const PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/
export const PHONE_FORMAT_HINT = "Format: (XXX) XXX-XXXX"

// Email format
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const EMAIL_FORMAT_HINT = "Format: example@domain.com"

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
}
export const PASSWORD_FORMAT_HINT = "Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character (!@#$%^&*)"

export function validatePhone(phone: string): { valid: boolean; message?: string } {
  if (!phone) {
    return { valid: false, message: "Phone is required" }
  }

  if (!PHONE_REGEX.test(phone)) {
    return { valid: false, message: `Invalid phone format. ${PHONE_FORMAT_HINT}` }
  }

  return { valid: true }
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

export function getEmailValidation(email: string): { valid: boolean; message?: string } {
  if (!email) {
    return { valid: false, message: "Email is required" }
  }

  if (!validateEmail(email)) {
    return { valid: false, message: `Invalid email format. ${EMAIL_FORMAT_HINT}` }
  }

  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; message?: string; details?: string[] } {
  if (!password) {
    return { valid: false, message: "Password is required" }
  }

  const issues: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    issues.push(`at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    issues.push("1 uppercase letter")
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    issues.push("1 lowercase letter")
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    issues.push("1 number")
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push("1 special character")
  }

  if (issues.length > 0) {
    return {
      valid: false,
      message: `Password must contain: ${issues.join(", ")}`,
      details: issues
    }
  }

  return { valid: true }
}

export function getPasswordStrength(password: string): { strength: "weak" | "medium" | "strong"; score: number } {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++

  if (score <= 2) return { strength: "weak", score }
  if (score <= 4) return { strength: "medium", score }
  return { strength: "strong", score }
}

export function validateRegistration(data: {
  email?: string
  password?: string
  fullName?: string
  phone?: string
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data.email) {
    errors.email = "Email is required"
  } else if (!validateEmail(data.email)) {
    errors.email = `Invalid email format. ${EMAIL_FORMAT_HINT}`
  }

  const passwordValidation = validatePassword(data.password || "")
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.message || "Invalid password"
  }

  if (data.phone) {
    const phoneValidation = validatePhone(data.phone)
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.message || "Invalid phone format"
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

// Helper to format phone number as user types
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "")

  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) {
    return digits.length > 0 ? `(${digits}` : ""
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
}

