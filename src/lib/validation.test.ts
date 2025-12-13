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
  it('should return valid for passwords meeting all requirements', () => {
    const result = validatePassword('1234Abc!')
    expect(result.valid).toBe(true)
  })

  it('should return valid for strong passwords', () => {
    const result = validatePassword('SecureP@ss1')
    expect(result.valid).toBe(true)
  })

  it('should return invalid for empty password', () => {
    expect(validatePassword('')).toEqual({
      valid: false,
      message: 'Password is required',
    })
  })

  it('should return invalid for passwords shorter than 8 characters', () => {
    const result = validatePassword('1Abc!')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('at least 8 characters')
  })

  it('should return invalid for passwords without uppercase', () => {
    const result = validatePassword('1234abc!')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('1 uppercase letter')
  })

  it('should return invalid for passwords without lowercase', () => {
    const result = validatePassword('1234ABC!')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('1 lowercase letter')
  })

  it('should return invalid for passwords without number', () => {
    const result = validatePassword('Abcdefgh!')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('1 number')
  })

  it('should return invalid for passwords without special character', () => {
    const result = validatePassword('1234Abcd')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('1 special character')
  })
})

describe('validateRegistration', () => {
  it('should return valid for correct registration data', () => {
    const result = validateRegistration({
      email: 'test@example.com',
      password: '1234Abc!',
      fullName: 'John Doe',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
  })

  it('should return errors for missing email', () => {
    const result = validateRegistration({
      password: '1234Abc!',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toBe('Email is required')
  })

  it('should return errors for invalid email format', () => {
    const result = validateRegistration({
      email: 'invalid-email',
      password: '1234Abc!',
    })
    expect(result.valid).toBe(false)
    expect(result.errors.email).toContain('Invalid email format')
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
    expect(result.errors.email).toContain('Invalid email format')
    expect(result.errors.password).toContain('Password must contain')
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

