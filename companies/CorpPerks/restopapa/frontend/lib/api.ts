import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const message = error.response?.data?.message || 'An error occurred'
    
    // Handle different status codes
    switch (error.response?.status) {
      case 401:
        toast.error('Authentication required')
        // Clear auth token if exists
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login'
        }
        break
      case 403:
        toast.error('Access denied')
        break
      case 404:
        toast.error('Resource not found')
        break
      case 422:
        // Validation errors - handle individually
        const validationErrors = error.response?.data?.errors
        if (validationErrors) {
          Object.values(validationErrors).forEach((errorMsg: any) => {
            toast.error(Array.isArray(errorMsg) ? errorMsg[0] : errorMsg)
          })
        } else {
          toast.error(message)
        }
        break
      case 429:
        toast.error('Too many requests. Please try again later.')
        break
      case 500:
        toast.error('Server error. Please try again later.')
        break
      default:
        if (!error.response) {
          toast.error('Network error. Please check your connection.')
        } else {
          toast.error(message)
        }
    }

    return Promise.reject(error)
  }
)

export default api