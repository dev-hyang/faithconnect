import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validateRegistration,
  sanitizeUserInput,
} from './validation'

describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name@domain.org')).toBe(true)
    expect(validateEmail('user+tag@subdomain.domain.com')).toBe(true)
  })

  it('should return false for invalid email addresses', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@domain.com')).toBe(false)
    expect(validateEmail('user@')).toBe(false)
    expect(validateEmail('user name@domain.com')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('should return valid for passwords with 6 or more characters', () => {
    expect(validatePassword('123456')).toEqual({ valid: true })
    expect(validatePassword('password123')).toEqual({ valid: true })
    expect(validatePassword('securePassword!')).toEqual({ valid: true })
  })

  it('should return invalid for empty password', () => {
    expect(validatePassword('')).toEqual({
      valid: false,
      message: 'Password is required',
    })
  })

  it('should return invalid for passwords shorter than 6 characters', () => {
    expect(validatePassword('12345')).toEqual({
      valid: false,
      message: 'Password must be at least 6 characters',
    })
    expect(validatePassword('abc')).toEqual({
      valid: false,
      message: 'Password must be at least 6 characters',
    })
  })
})

describe('validateRegistration', () => {
  it('should return valid for correct registration data', () => {
    const result = validateRegistration({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'John Doe',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('should return errors for missing email', () => {
    const result = validateRegistration({
      password: 'password123',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBe('Email is required')
  })

  it('should return errors for invalid email format', () => {
    const result = validateRegistration({
      email: 'invalid-email',
      password: 'password123',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBe('Invalid email format')
  })

  it('should return errors for missing password', () => {
    const result = validateRegistration({
      email: 'test@example.com',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.password).toBe('Password is required')
  })

  it('should return multiple errors for multiple invalid fields', () => {
    const result = validateRegistration({
      email: 'invalid',
      password: 'abc',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBe('Invalid email format')
    expect(result.errors.password).toBe('Password must be at least 6 characters')
  })
})

describe('sanitizeUserInput', () => {
  it('should trim whitespace', () => {
    expect(sanitizeUserInput('  hello  ')).toBe('hello')
    expect(sanitizeUserInput('\n\ttest\n\t')).toBe('test')
  })

  it('should remove angle brackets to prevent XSS', () => {
    expect(sanitizeUserInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    expect(sanitizeUserInput('Hello <b>World</b>')).toBe('Hello bWorld/b')
  })

  it('should handle empty strings', () => {
    expect(sanitizeUserInput('')).toBe('')
  })

  it('should handle normal text without modification', () => {
    expect(sanitizeUserInput('Normal text here')).toBe('Normal text here')
  })
})

