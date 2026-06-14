/**
 * Input Validation Utilities
 * Zod-like validation without external dependencies
 */

export interface ValidationResult {
  valid: boolean
  error?: string
  value?: string
}

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .replace(/\s+/g, ' ') // Normalize whitespace
}

export function validateSearchQuery(input: string): ValidationResult {
  const sanitized = sanitizeString(input)

  if (sanitized.length < 2) {
    return { valid: false, error: 'Search query must be at least 2 characters' }
  }

  if (sanitized.length > 100) {
    return { valid: false, error: 'Search query must be less than 100 characters' }
  }

  return { valid: true, value: sanitized }
}

export function validatePhone(phone: string): ValidationResult {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length < 10) {
    return { valid: false, error: 'Phone number must be at least 10 digits' }
  }

  if (cleaned.length > 15) {
    return { valid: false, error: 'Phone number is too long' }
  }

  return { valid: true, value: cleaned }
}

export function validateOTP(otp: string): ValidationResult {
  if (!/^\d{4,8}$/.test(otp)) {
    return { valid: false, error: 'OTP must be 4-8 digits' }
  }

  return { valid: true, value: otp }
}

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true, value: email.toLowerCase() }
}

export function validateSlug(slug: string): ValidationResult {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  if (!slugRegex.test(slug)) {
    return { valid: false, error: 'Invalid slug format' }
  }

  return { valid: true, value: slug }
}

export function validatePrice(price: number): ValidationResult {
  if (isNaN(price) || price < 0) {
    return { valid: false, error: 'Price must be a positive number' }
  }

  if (price > 1000000) {
    return { valid: false, error: 'Price exceeds maximum allowed value' }
  }

  return { valid: true }
}

export function validateQuantity(quantity: number): ValidationResult {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { valid: false, error: 'Quantity must be at least 1' }
  }

  if (quantity > 100) {
    return { valid: false, error: 'Quantity exceeds maximum allowed value' }
  }

  return { valid: true }
}

// Type guard for API response data
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export default {
  sanitizeString,
  validateSearchQuery,
  validatePhone,
  validateOTP,
  validateEmail,
  validateSlug,
  validatePrice,
  validateQuantity,
  isNonNull,
}
