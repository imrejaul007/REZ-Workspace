'use client'

import { motion } from 'framer-motion'
import { Terminal, Zap, Shield, Clock } from 'lucide-react'
import { ApiTester } from '@/components/ApiTester'

const authEndpoints = [
  {
    method: 'POST' as const,
    path: '/api/auth/verify',
    description: 'Verify a JWT token',
    body: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  },
  {
    method: 'POST' as const,
    path: '/api/auth/login',
    description: 'Authenticate user and get JWT',
    body: {
      email: 'user@example.com',
      password: 'password123',
    },
  },
  {
    method: 'POST' as const,
    path: '/api/auth/register',
    description: 'Register a new user',
    body: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      phone: '+919876543210',
      password: 'securePassword123',
    },
  },
  {
    method: 'POST' as const,
    path: '/api/auth/refresh',
    description: 'Refresh JWT token',
    body: {
      refresh_token: 'refresh_token_here',
    },
  },
  {
    method: 'POST' as const,
    path: '/api/auth/otp/send',
    description: 'Send OTP to phone/email',
    body: {
      channel: 'sms',
      recipient: '+919876543210',
      purpose: 'login',
    },
  },
]

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Real-time Responses',
    description: 'See actual API responses with timing information',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Sandbox Environment',
    description: 'Test safely without affecting production data',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Request History',
    description: 'Review your recent API calls and responses',
  },
]

export default function PlaygroundPage() {
  return (
    <div className="pt-24 pb-16 px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium mb-4">
          <Terminal className="w-4 h-4" />
          Live Testing
        </div>
        <h1 className="text-4xl font-bold mb-4">API Playground</h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          Test REZ API endpoints directly from your browser. No setup required - just select an
          endpoint, configure the request, and see the response in real-time.
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-6xl mx-auto mb-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-medium text-sm">{feature.title}</h3>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* API Tester */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tester */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-6">Auth Service Endpoints</h2>
            <ApiTester endpoints={authEndpoints} />
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Quick Examples</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#0d0d14] border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                      POST
                    </span>
                    <code className="text-sm text-indigo-400">/api/auth/login</code>
                  </div>
                  <pre className="text-xs text-gray-500 font-mono">
{`{
  "email": "user@example.com",
  "password": "password123"
}`}
                  </pre>
                </div>

                <div className="p-4 rounded-lg bg-[#0d0d14] border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                      POST
                    </span>
                    <code className="text-sm text-indigo-400">/api/auth/otp/send</code>
                  </div>
                  <pre className="text-xs text-gray-500 font-mono">
{`{
  "channel": "sms",
  "recipient": "+919876543210",
  "purpose": "login"
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <h3 className="text-lg font-semibold mb-4">Tips</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">1.</span>
                  Use the sandbox environment for testing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">2.</span>
                  Check response headers for rate limit info
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">3.</span>
                  All amounts are in paise (1 INR = 100 paise)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400 mt-1">4.</span>
                  Include request IDs in support tickets
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Base URLs</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Production</div>
                  <code className="text-sm text-green-400">
                    https://rez-auth-service.onrender.com
                  </code>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Sandbox</div>
                  <code className="text-sm text-yellow-400">
                    https://sandbox.rez-auth-service.onrender.com
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
