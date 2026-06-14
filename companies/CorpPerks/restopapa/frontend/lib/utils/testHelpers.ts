import { logger } from ;

// Test utilities and helpers for comprehensive testing

import { validateEmail, validatePhone, validatePrice, validateQuantity, validateGST, validateFSSAI } from './validation'
import { ErrorCodes, createError } from './errorHandling'

// Test data generators
export const generateTestUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-1',
  email: 'test@restaurant.com',
  phone: '+919876543210',
  name: 'Test Restaurant',
  role: 'restaurant_owner',
  verified: true,
  createdAt: new Date().toISOString(),
  ...overrides
})

export const generateTestProduct = (overrides: Partial<any> = {}) => ({
  id: 'test-product-1',
  name: 'Test Product',
  description: 'Test product description',
  price: 100,
  category: 'vegetables',
  brand: 'Test Brand',
  images: ['/test-image.jpg'],
  unitSize: '1',
  unitType: 'kg',
  minOrderQuantity: 1,
  maxOrderQuantity: 100,
  gstRate: 5,
  gstIncluded: false,
  availability: 'in-stock',
  stockQuantity: 50,
  vendorId: 'test-vendor-1',
  rating: 4.5,
  reviewCount: 10,
  isVerified: true,
  ...overrides
})

export const generateTestOrder = (overrides: Partial<any> = {}) => ({
  id: 'test-order-1',
  orderNumber: 'ORD-TEST-001',
  userId: 'test-user-1',
  items: [generateTestProduct()],
  subtotal: 100,
  totalGst: 5,
  totalDiscount: 0,
  deliveryCharges: 50,
  grandTotal: 155,
  status: 'placed',
  paymentStatus: 'completed',
  createdAt: new Date().toISOString(),
  estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides
})

// Validation test cases
export const runValidationTests = () => {
  const results: any[] = []

  // Email validation tests
  const emailTests = [
    { input: 'test@example.com', expected: true },
    { input: 'invalid-email', expected: false },
    { input: '', expected: false },
    { input: 'test@', expected: false },
    { input: '@example.com', expected: false }
  ]

  emailTests.forEach(test => {
    const result = validateEmail(test.input)
    results.push({
      type: 'email',
      input: test.input,
      expected: test.expected,
      actual: result.isValid,
      passed: result.isValid === test.expected
    })
  })

  // Phone validation tests
  const phoneTests = [
    { input: '9876543210', expected: true },
    { input: '+919876543210', expected: true },
    { input: '1234567890', expected: false },
    { input: '987654321', expected: false },
    { input: 'abcdefghij', expected: false }
  ]

  phoneTests.forEach(test => {
    const result = validatePhone(test.input)
    results.push({
      type: 'phone',
      input: test.input,
      expected: test.expected,
      actual: result.isValid,
      passed: result.isValid === test.expected
    })
  })

  // Price validation tests
  const priceTests = [
    { input: 100, expected: true },
    { input: '100.50', expected: true },
    { input: 0, expected: true },
    { input: -10, expected: false },
    { input: 'invalid', expected: false }
  ]

  priceTests.forEach(test => {
    const result = validatePrice(test.input)
    results.push({
      type: 'price',
      input: test.input,
      expected: test.expected,
      actual: result.isValid,
      passed: result.isValid === test.expected
    })
  })

  return results
}

// Error handling test cases
export const runErrorHandlingTests = () => {
  const results: any[] = []

  try {
    // Test error creation
    const error = createError(ErrorCodes.VALIDATION_ERROR, 'Test error')
    results.push({
      type: 'error_creation',
      passed: error.code === ErrorCodes.VALIDATION_ERROR && error.message === 'Test error'
    })
  } catch (e) {
    results.push({
      type: 'error_creation',
      passed: false,
      error: e
    })
  }

  return results
}

// Component test utilities
export const mockApiResponse = <T>(data: T, delay = 100) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

export const mockApiError = (errorCode: ErrorCodes, delay = 100) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(createError(errorCode, 'Mock error')), delay)
  })
}

// Performance testing
export const measurePerformance = async <T>(
  fn: () => Promise<T> | T,
  label: string
): Promise<{ result: T; duration: number }> => {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  const duration = end - start
  
  logger.info(`Performance [${label}]: ${duration.toFixed(2)}ms`)
  
  return { result, duration }
}

// Load testing simulation
export const simulateLoad = async <T>(
  fn: () => Promise<T>,
  concurrent: number,
  iterations: number
): Promise<{ success: number; errors: number; avgDuration: number }> => {
  const startTime = performance.now()
  let success = 0
  let errors = 0
  const promises: Promise<any>[] = []

  for (let i = 0; i < concurrent; i++) {
    for (let j = 0; j < iterations; j++) {
      promises.push(
        fn()
          .then(() => { success++ })
          .catch(() => { errors++ })
      )
    }
  }

  await Promise.allSettled(promises)
  
  const totalTime = performance.now() - startTime
  const avgDuration = totalTime / (concurrent * iterations)

  return { success, errors, avgDuration }
}

// Memory leak detection
export const detectMemoryLeaks = () => {
  if (typeof window !== 'undefined' && (window as any).performance?.memory) {
    const memory = (window as any).performance.memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    }
  }
  return null
}

// Accessibility testing helpers
export const checkAccessibility = (element: HTMLElement) => {
  const issues: string[] = []
  
  // Check for alt attributes on images
  const images = element.querySelectorAll('img')
  images.forEach(img => {
    if (!img.alt) {
      issues.push('Image missing alt attribute')
    }
  })
  
  // Check for aria labels on buttons without text
  const buttons = element.querySelectorAll('button')
  buttons.forEach(button => {
    if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
      issues.push('Button missing accessible text or aria-label')
    }
  })
  
  // Check for form labels
  const inputs = element.querySelectorAll('input')
  inputs.forEach(input => {
    const id = input.id
    if (id && !element.querySelector(`label[for="${id}"]`)) {
      issues.push(`Input with id "${id}" missing associated label`)
    }
  })
  
  return issues
}

// API integration test helpers
export const testApiEndpoint = async (url: string, method: string = 'GET', data?: any) => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(url, options)
    
    return {
      status: response.status,
      ok: response.ok,
      data: await response.json(),
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
      ok: false
    }
  }
}

// Database integrity tests
export const testDataIntegrity = (data: any[], requiredFields: string[]) => {
  const issues: string[] = []
  
  data.forEach((item, index) => {
    requiredFields.forEach(field => {
      if (!item[field]) {
        issues.push(`Item ${index}: Missing required field "${field}"`)
      }
    })
    
    // Check for duplicate IDs
    const duplicates = data.filter(d => d.id === item.id)
    if (duplicates.length > 1) {
      issues.push(`Duplicate ID found: ${item.id}`)
    }
  })
  
  return issues
}

// Security test helpers
export const testInputSanitization = (input: string) => {
  const dangerous = ['<script>', 'javascript:', 'onload=', 'onerror=', 'eval(']
  const found = dangerous.filter(pattern => input.toLowerCase().includes(pattern))
  
  return {
    safe: found.length === 0,
    threats: found
  }
}

// Run all tests
export const runAllTests = () => {
  console.group('🧪 Running Comprehensive Tests')
  
  const validationResults = runValidationTests()
  const errorResults = runErrorHandlingTests()
  
  const totalTests = validationResults.length + errorResults.length
  const passedTests = [...validationResults, ...errorResults].filter(r => r.passed).length
  
  logger.info(`✅ Passed: ${passedTests}/${totalTests} tests`)
  logger.info('📊 Validation Tests:', validationResults)
  logger.info('🚨 Error Handling Tests:', errorResults)
  
  if (passedTests === totalTests) {
    logger.info('🎉 All tests passed!')
  } else {
    logger.warn('⚠️ Some tests failed. Check the results above.')
  }
  
  console.groupEnd()
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    details: { validationResults, errorResults }
  }
}