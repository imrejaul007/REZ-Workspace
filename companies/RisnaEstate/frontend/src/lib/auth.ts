// Authentication utilities
import { api } from './api'

interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'buyer' | 'broker' | 'admin'
  }
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  role?: 'buyer' | 'broker'
}

const TOKEN_KEY = 'risna_token'
const USER_KEY = 'risna_user'

export const auth = {
  // Get current token
  getToken: () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY)
  },

  // Get current user
  getUser: () => {
    if (typeof window === 'undefined') return null
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  // Login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/api/auth/login', {
      email,
      password
    })
    const { token, user } = response.data.data

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    // Set auth header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    return response.data.data
  },

  // Register
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post<{ success: boolean; data: LoginResponse }>('/api/auth/register', data)
    const { token, user } = response.data.data

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    return response.data.data
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete api.defaults.headers.common['Authorization']
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!auth.getToken()
  },

  // Check if broker
  isBroker: () => {
    const user = auth.getUser()
    return user?.role === 'broker'
  },

  // Check if admin
  isAdmin: () => {
    const user = auth.getUser()
    return user?.role === 'admin'
  },

  // Initialize auth on app load
  init: () => {
    const token = auth.getToken()
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }
}

export default auth
