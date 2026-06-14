'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  role: 'restaurant' | 'employee' | 'vendor' | 'admin'
  restaurant?: any
  employee?: any
  vendor?: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: any) => Promise<void>
  updateProfile: (data: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('auth_token')
      if (token) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/profile')
          setUser(response.data)
        } catch (error) {
          logger.error('Failed to fetch user profile:', error)
          Cookies.remove('auth_token')
          delete api.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user: userData, token } = response.data

      // Set token in cookie with proper security flags
      Cookies.set('auth_token', token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)
      
      // Redirect based on user role
      switch (userData.role) {
        case 'restaurant':
          router.push('/dashboard/restaurant')
          break
        case 'employee':
          router.push('/dashboard/employee')
          break
        case 'vendor':
          router.push('/dashboard/vendor')
          break
        case 'admin':
          router.push('/dashboard/admin')
          break
        default:
          router.push('/dashboard')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const logout = () => {
    Cookies.remove('auth_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/')
  }

  const register = async (data: any) => {
    try {
      const response = await api.post('/auth/register', data)
      const { user: userData, token } = response.data

      // Set token in cookie with proper security flags
      Cookies.set('auth_token', token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      })
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      setUser(userData)
      
      // Redirect to onboarding or dashboard based on user role
      switch (userData.role) {
        case 'restaurant':
          router.push('/onboarding/restaurant')
          break
        case 'employee':
          router.push('/onboarding/employee')
          break
        case 'vendor':
          router.push('/onboarding/vendor')
          break
        default:
          router.push('/dashboard')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  }

  const updateProfile = async (data: any) => {
    try {
      const response = await api.put('/auth/profile', data)
      setUser(response.data)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed')
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}