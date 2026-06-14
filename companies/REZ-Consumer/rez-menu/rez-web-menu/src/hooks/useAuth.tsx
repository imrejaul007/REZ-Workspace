'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  phone: string
  name?: string
  email?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (phone: string) => Promise<void>
  verifyOtp: (phone: string, otp: string) => Promise<boolean>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_STORAGE_KEY = 'rez_auth_token'
const USER_STORAGE_KEY = 'rez_auth_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_STORAGE_KEY)
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (phone: string): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'send_otp' })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      // In dev mode, OTP is returned in response
      if (data.data?.otp) {
        console.log(`[DEV] OTP: ${data.data.otp}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, action: 'verify_otp' })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Invalid OTP')
      }

      // Store token and user
      localStorage.setItem(AUTH_STORAGE_KEY, data.data.accessToken)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.data.user))

      setToken(data.data.accessToken)
      setUser(data.data.user)

      return true
    } catch (error) {
      console.error('OTP verification failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    // Call logout API if authenticated
    if (token) {
      try {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (error) {
        console.error('Logout API error:', error)
      }
    }

    // Clear local state
    localStorage.removeItem(AUTH_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }

  const refreshAuth = async (): Promise<void> => {
    if (!token) return

    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await response.json()

      if (!data.success) {
        logout()
      } else {
        setUser(data.data.user)
      }
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        verifyOtp,
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Helper to get user ID
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem(USER_STORAGE_KEY)
  if (!userStr) return null
  try {
    const user = JSON.parse(userStr)
    return user.id
  } catch {
    return null
  }
}

export default useAuth
