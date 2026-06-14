'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { logger } from '@/lib/logger'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, verifyOtp, isAuthenticated, isLoading: authLoading } = useAuth()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = searchParams.get('redirect') || '/'

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, authLoading, router, redirectTo])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(phone)
      setStep('otp')
    } catch (err) {
      setError('Failed to send OTP. Please try again.')
      logger.error('Login failed', err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }

    if (digit && index === 3) {
      const fullOtp = [...newOtp].join('')
      if (fullOtp.length === 4) {
        handleOtpSubmit(fullOtp)
      }
    }
  }

  const handleOtpSubmit = async (fullOtp?: string) => {
    const otpValue = fullOtp || otp.join('')
    if (otpValue.length !== 4) {
      setError('Please enter complete OTP')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const success = await verifyOtp(phone, otpValue)
      if (success) {
        router.push(redirectTo)
      } else {
        setError('Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
      logger.error('OTP verification failed', err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🍽️</div>
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'phone' ? 'Welcome!' : 'Verify OTP'}
            </h1>
            <p className="text-gray-500 mt-2">
              {step === 'phone'
                ? 'Enter your phone number to continue'
                : `We sent a code to ${phone}`
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || phone.length < 10}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Get OTP'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* OTP Inputs */}
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ))}
              </div>

              <button
                onClick={() => handleOtpSubmit()}
                disabled={isLoading || otp.join('').length < 4}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <button
                onClick={() => {
                  setStep('phone')
                  setOtp(['', '', '', ''])
                  setError('')
                }}
                className="w-full text-blue-600 py-2 text-sm hover:underline"
              >
                Change phone number
              </button>

              <p className="text-center text-sm text-gray-500">
                Didn't receive code?{' '}
                <button
                  onClick={async () => {
                    await login(phone)
                    setError('')
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Resend
                </button>
              </p>
            </div>
          )}

          {/* Terms */}
          <p className="mt-8 text-xs text-gray-500 text-center">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
