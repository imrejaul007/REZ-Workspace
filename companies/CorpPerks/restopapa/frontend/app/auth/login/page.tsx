'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/components/providers/AuthProvider'

const userTypes = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Platform administration and management',
    icon: '👨‍💼',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    description: 'Restaurant owners and managers',
    icon: '🏪',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'employee',
    title: 'Employee',
    description: 'Restaurant staff and job seekers',
    icon: '👥',
    color: 'from-green-500 to-green-600'
  }
]

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role)
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      // AuthProvider handles redirect based on user role
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-4xl font-bold text-primary-600 mb-4 inline-block">RestaurantHub</Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-xl text-gray-600">Select your account type to continue</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {userTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleRoleSelect(type.id)}
                className="group p-8 bg-white rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-200 hover:border-primary-300"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center text-2xl mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                  {type.icon}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">{type.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{type.description}</p>
                <div className="mt-4 text-primary-600 font-medium group-hover:text-primary-700">
                  Login as {type.title} →
                </div>
              </button>
            ))}
          </div>
          
        </div>
      </div>
    )
  }

  const selectedType = userTypes.find(type => type.id === selectedRole)!

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-soft p-8">
          <div className="text-center mb-8">
            <button
              onClick={() => setSelectedRole('')}
              className="text-gray-500 hover:text-gray-700 mb-4 text-sm"
            >
              ← Back to role selection
            </button>
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${selectedType.color} flex items-center justify-center text-2xl mb-4 mx-auto`}>
              {selectedType.icon}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedType.title} Login
            </h2>
            <p className="text-gray-600">{selectedType.description}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-gray-700">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : `bg-gradient-to-r ${selectedType.color} hover:opacity-90`
              }`}
            >
              {isLoading ? 'Signing in...' : `Sign in as ${selectedType.title}`}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              New to RestaurantHub?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}