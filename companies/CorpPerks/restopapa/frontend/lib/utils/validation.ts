// Validation utilities for the restaurant SaaS application

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = []
  
  if (!email) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address')
  }
  
  return { isValid: errors.length === 0, errors }
}

// Phone number validation (Indian format)
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = []
  
  if (!phone) {
    errors.push('Phone number is required')
  } else {
    // Remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '')
    
    // Check for Indian mobile number format
    if (!/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      errors.push('Please enter a valid 10-digit Indian mobile number')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

// GST number validation
export const validateGST = (gst: string): ValidationResult => {
  const errors: string[] = []
  
  if (!gst) {
    errors.push('GST number is required')
  } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
    errors.push('Please enter a valid GST number (15 characters)')
  }
  
  return { isValid: errors.length === 0, errors }
}

// FSSAI license validation
export const validateFSSAI = (fssai: string): ValidationResult => {
  const errors: string[] = []
  
  if (!fssai) {
    errors.push('FSSAI license is required')
  } else if (!/^\d{14}$/.test(fssai)) {
    errors.push('FSSAI license must be 14 digits')
  }
  
  return { isValid: errors.length === 0, errors }
}

// Price validation
export const validatePrice = (price: number | string): ValidationResult => {
  const errors: string[] = []
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  
  if (isNaN(numPrice)) {
    errors.push('Price must be a valid number')
  } else if (numPrice < 0) {
    errors.push('Price cannot be negative')
  } else if (numPrice > 1000000) {
    errors.push('Price cannot exceed ₹10,00,000')
  }
  
  return { isValid: errors.length === 0, errors }
}

// Quantity validation
export const validateQuantity = (
  quantity: number | string, 
  min: number = 1, 
  max: number = 1000
): ValidationResult => {
  const errors: string[] = []
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity) : quantity
  
  if (isNaN(numQuantity)) {
    errors.push('Quantity must be a valid number')
  } else if (numQuantity < min) {
    errors.push(`Minimum quantity is ${min}`)
  } else if (numQuantity > max) {
    errors.push(`Maximum quantity is ${max}`)
  }
  
  return { isValid: errors.length === 0, errors }
}

// Pincode validation
export const validatePincode = (pincode: string): ValidationResult => {
  const errors: string[] = []
  
  if (!pincode) {
    errors.push('Pincode is required')
  } else if (!/^\d{6}$/.test(pincode)) {
    errors.push('Pincode must be 6 digits')
  }
  
  return { isValid: errors.length === 0, errors }
}

// Credit amount validation
export const validateCreditAmount = (
  amount: number | string,
  availableLimit: number
): ValidationResult => {
  const errors: string[] = []
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    errors.push('Credit amount must be a valid number')
  } else if (numAmount <= 0) {
    errors.push('Credit amount must be greater than 0')
  } else if (numAmount > availableLimit) {
    errors.push(`Credit amount cannot exceed available limit of ₹${availableLimit}`)
  }
  
  return { isValid: errors.length === 0, errors }
}

// Form validation wrapper
export const validateForm = (
  data: Record<string, any>,
  validations: Record<string, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {}
  let isValid = true
  
  for (const [field, validator] of Object.entries(validations)) {
    const result = validator(data[field])
    if (!result.isValid) {
      errors[field] = result.errors
      isValid = false
    }
  }
  
  return { isValid, errors }
}

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}

export const sanitizeNumber = (input: string | number): number => {
  const num = typeof input === 'string' ? parseFloat(input.replace(/[^\d.-]/g, '')) : input
  return isNaN(num) ? 0 : num
}

export const sanitizeInteger = (input: string | number): number => {
  const num = typeof input === 'string' ? parseInt(input.replace(/[^\d-]/g, '')) : input
  return isNaN(num) ? 0 : num
}