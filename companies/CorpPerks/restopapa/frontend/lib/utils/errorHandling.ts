// Error handling utilities for the restaurant SaaS application

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export enum ErrorCodes {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  API_ERROR = 'API_ERROR',
  
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  
  // Business logic errors
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  VENDOR_NOT_AVAILABLE = 'VENDOR_NOT_AVAILABLE',
  CREDIT_LIMIT_EXCEEDED = 'CREDIT_LIMIT_EXCEEDED',
  
  // System errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

// Create standardized error
export const createError = (
  code: ErrorCodes,
  message: string,
  details?: any
): AppError => ({
  code,
  message,
  details,
  timestamp: new Date()
})

// Error message mapping
export const getErrorMessage = (code: ErrorCodes): string => {
  const messages = {
    [ErrorCodes.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
    [ErrorCodes.TIMEOUT_ERROR]: 'Request timeout. Please try again.',
    [ErrorCodes.API_ERROR]: 'Server error occurred. Please try again later.',
    [ErrorCodes.UNAUTHORIZED]: 'Please log in to continue.',
    [ErrorCodes.FORBIDDEN]: 'You don\'t have permission to perform this action.',
    [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
    [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCodes.INVALID_INPUT]: 'Invalid input provided.',
    [ErrorCodes.REQUIRED_FIELD]: 'Please fill all required fields.',
    [ErrorCodes.INSUFFICIENT_STOCK]: 'Not enough stock available.',
    [ErrorCodes.PAYMENT_FAILED]: 'Payment processing failed. Please try again.',
    [ErrorCodes.ORDER_NOT_FOUND]: 'Order not found.',
    [ErrorCodes.VENDOR_NOT_AVAILABLE]: 'Vendor is currently unavailable.',
    [ErrorCodes.CREDIT_LIMIT_EXCEEDED]: 'Credit limit exceeded. Please make a payment.',
    [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred.',
    [ErrorCodes.DATABASE_ERROR]: 'Database error. Please try again later.',
    [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again later.'
  }
  
  return messages[code] || messages[ErrorCodes.UNKNOWN_ERROR]
}

// Error handler wrapper for async functions
export const withErrorHandler = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorCode: ErrorCodes = ErrorCodes.UNKNOWN_ERROR
) => {
  return async (...args: T): Promise<{ data?: R; error?: AppError }> => {
    try {
      const data = await fn(...args)
      return { data }
    } catch (error) {
      const appError = createError(
        errorCode,
        error instanceof Error ? error.message : getErrorMessage(errorCode),
        error
      )
      logger.error('Error in function:', fn.name, appError)
      return { error: appError }
    }
  }
}

// API error handler
export const handleApiError = (error: any): AppError => {
  if (error.response) {
    const status = error.response.status
    switch (status) {
      case 401:
        return createError(ErrorCodes.UNAUTHORIZED, 'Authentication failed')
      case 403:
        return createError(ErrorCodes.FORBIDDEN, 'Access denied')
      case 404:
        return createError(ErrorCodes.API_ERROR, 'Resource not found')
      case 422:
        return createError(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.response.data)
      case 429:
        return createError(ErrorCodes.API_ERROR, 'Too many requests. Please try again later.')
      case 500:
        return createError(ErrorCodes.API_ERROR, 'Internal server error')
      case 503:
        return createError(ErrorCodes.SERVICE_UNAVAILABLE, 'Service temporarily unavailable')
      default:
        return createError(ErrorCodes.API_ERROR, `Server error: ${status}`)
    }
  } else if (error.request) {
    return createError(ErrorCodes.NETWORK_ERROR, 'Network error. Please check your connection.')
  } else if (error.code === 'ECONNABORTED') {
    return createError(ErrorCodes.TIMEOUT_ERROR, 'Request timeout')
  } else {
    return createError(
      ErrorCodes.UNKNOWN_ERROR,
      error.message || 'An unexpected error occurred'
    )
  }
}

// Local storage error handler
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      logger.error('LocalStorage getItem error:', error)
      return null
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      logger.error('LocalStorage setItem error:', error)
      return false
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      logger.error('LocalStorage removeItem error:', error)
      return false
    }
  }
}

// JSON parsing with error handling
export const safeJsonParse = <T>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json)
  } catch (error) {
    logger.error('JSON parse error:', error)
    return defaultValue
  }
}

// Number parsing with error handling
export const safeParseNumber = (value: string | number, defaultValue: number = 0): number => {
  if (typeof value === 'number') return value
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

// Safe array access
export const safeArrayAccess = <T>(array: T[], index: number, defaultValue: T): T => {
  return array && array[index] !== undefined ? array[index] : defaultValue
}

// Retry mechanism
export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return retry(fn, retries - 1, delay * 2) // Exponential backoff
    }
    throw error
  }
}

// Debounce function for API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Rate limiting
export class RateLimiter {
  private calls: number[] = []
  
  constructor(
    private maxCalls: number,
    private windowMs: number
  ) {}
  
  canMakeCall(): boolean {
    const now = Date.now()
    this.calls = this.calls.filter(time => now - time < this.windowMs)
    
    if (this.calls.length >= this.maxCalls) {
      return false
    }
    
    this.calls.push(now)
    return true
  }
  
  getRemainingTime(): number {
    if (this.calls.length < this.maxCalls) return 0
    const oldestCall = Math.min(...this.calls)
    return Math.max(0, this.windowMs - (Date.now() - oldestCall))
  }
}