import { useState } from 'react'
import { useRouter } from 'next/router'
import auth from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'buyer' as 'buyer' | 'broker'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await auth.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-2">Join RisnaEstate today</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="buyer"
                  checked={form.role === 'buyer'}
                  onChange={() => setForm({ ...form, role: 'buyer' })}
                  className="mr-2"
                />
                <span>Property Buyer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value="broker"
                  checked={form.role === 'broker'}
                  onChange={() => setForm({ ...form, role: 'broker' })}
                  className="mr-2"
                />
                <span>Broker/Agent</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <label className="flex items-start">
            <input type="checkbox" className="mt-1 mr-2" required />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="/terms" className="text-primary-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary-600 hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
