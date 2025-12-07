// Validation utilities for user authentication

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: "Password is required" }
  }
  
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" }
  }
  
  return { valid: true }
}

export function validateRegistration(data: {
  email?: string
  password?: string
  fullName?: string
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!data.email) {
    errors.email = "Email is required"
  } else if (!validateEmail(data.email)) {
    errors.email = "Invalid email format"
  }

  const passwordValidation = validatePassword(data.password || "")
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.message || "Invalid password"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

