/**
 * Auth Context - Global auth state
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import auth from '@/lib/auth'

interface User {
  id: string
  name: string
  email: string
  role: 'buyer' | 'broker' | 'admin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = auth.getUser()
    if (storedUser) setUser(storedUser)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { user } = await auth.login(email, password)
    setUser(user)
  }

  const register = async (data: any) => {
    const { user } = await auth.register(data)
    setUser(user)
  }

  const logout = () => {
    auth.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
