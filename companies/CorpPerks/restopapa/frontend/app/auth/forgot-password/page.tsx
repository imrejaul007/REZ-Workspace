'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

export default function ForgotPassword() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Email, 2: Code, 3: Reset, 4: Success
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setStep(2)
      setResendCooldown(60)
      // Start countdown
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 1500)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Simulate verification
    setTimeout(() => {
      if (resetCode === '123456') {
        setIsLoading(false)
        setStep(3)
      } else {
        setIsLoading(false)
        setError('Invalid reset code. Please try again.')
      }
    }, 1000)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)

    // Simulate password reset
    setTimeout(() => {
      setIsLoading(false)
      setStep(4)
    }, 1500)
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError('')

    // Simulate resend
    setTimeout(() => {
      setIsLoading(false)
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-soft p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-primary-600 mb-4 inline-block">
              RestaurantHub
            </Link>
            
            <button
              onClick={() => step === 1 ? router.push('/auth/login') : step > 1 && setStep(step - 1)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {step === 1 ? 'Back to login' : 'Back'}
            </button>

            {step === 1 && (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-600">Enter your email address and we'll send you a reset code</p>
              </>
            )}

            {step === 2 && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EnvelopeIcon className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
                <p className="text-gray-600">We've sent a reset code to <strong>{email}</strong></p>
              </>
            )}

            {step === 3 && (
              <>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h1>
                <p className="text-gray-600">Enter your new password below</p>
              </>
            )}

            {step === 4 && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
                <p className="text-gray-600">Your password has been successfully reset</p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendResetCode} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                  isLoading || !email
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Reset Code
                </label>
                <input
                  id="resetCode"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-center text-2xl tracking-widest"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the 6-digit code we sent to your email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || resetCode.length !== 6}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                  isLoading || resetCode.length !== 6
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-12"
                    placeholder="Enter new password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors pr-12"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                    <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    One number
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                  isLoading || !newPassword || !confirmPassword
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
              </div>

              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Continue to Login
              </button>
            </div>
          )}

          {/* Login Link */}
          {step < 4 && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Demo Info */}
        {step === 2 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Demo Mode:</h4>
            <p className="text-xs text-blue-700">
              Use code <strong>123456</strong> to continue with the password reset process.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}