'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Copy, Check } from 'lucide-react'
import { CodeBlock } from '@/components/CodeBlock'

const services = [
  {
    name: 'Auth Service',
    port: 4002,
    description: 'Authentication, JWT tokens, OTP, MFA, OAuth',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/register',
        description: 'Register a new user',
        body: {
          name: 'string (required)',
          email: 'string (required)',
          phone: 'string (required)',
          password: 'string (required)',
        },
        response: {
          user_id: 'string',
          token: 'string',
          refresh_token: 'string',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/login',
        description: 'Authenticate user',
        body: {
          email: 'string (required)',
          password: 'string (required)',
        },
        response: {
          user_id: 'string',
          token: 'string',
          refresh_token: 'string',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/verify',
        description: 'Verify JWT token',
        body: {
          token: 'string (required)',
        },
        response: {
          valid: 'boolean',
          user: 'User object',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/refresh',
        description: 'Refresh JWT token',
        body: {
          refresh_token: 'string (required)',
        },
        response: {
          token: 'string',
          refresh_token: 'string',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/otp/send',
        description: 'Send OTP',
        body: {
          channel: 'sms | email (required)',
          recipient: 'string (required)',
          purpose: 'login | verification (required)',
        },
        response: {
          otp_id: 'string',
          expires_at: 'ISO timestamp',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/otp/verify',
        description: 'Verify OTP',
        body: {
          otp_id: 'string (required)',
          otp: 'string (required)',
        },
        response: {
          verified: 'boolean',
          token: 'string (if verified)',
        },
      },
    ],
  },
  {
    name: 'Payment Service',
    port: 4001,
    description: 'Razorpay, UPI, Webhooks',
    endpoints: [
      {
        method: 'POST',
        path: '/api/payments/create',
        description: 'Create a new payment',
        body: {
          amount: 'number (required, in paise)',
          currency: 'string (required, e.g., INR)',
          receipt: 'string (optional)',
          customer: {
            name: 'string (required)',
            email: 'string (required)',
            phone: 'string (required)',
          },
        },
        response: {
          id: 'string',
          amount: 'number',
          currency: 'string',
          status: 'created | authorized | captured | failed',
        },
      },
      {
        method: 'POST',
        path: '/api/payments/:id/capture',
        description: 'Capture authorized payment',
        body: {
          amount: 'number (optional, partial capture)',
        },
        response: {
          id: 'string',
          status: 'captured',
        },
      },
      {
        method: 'POST',
        path: '/api/payments/:id/refund',
        description: 'Refund a payment',
        body: {
          amount: 'number (optional, partial refund)',
          reason: 'string (optional)',
        },
        response: {
          refund_id: 'string',
          status: 'processed',
        },
      },
    ],
  },
  {
    name: 'Order Service',
    port: 4006,
    description: 'Order lifecycle, FSM, tracking',
    endpoints: [
      {
        method: 'POST',
        path: '/api/orders/create',
        description: 'Create a new order',
        body: {
          customer_id: 'string (required)',
          items: 'OrderItem[] (required)',
          shipping_address: 'Address (required)',
          payment_method: 'string (required)',
        },
        response: {
          order_id: 'string',
          status: 'created',
          total: 'number',
        },
      },
      {
        method: 'GET',
        path: '/api/orders/:id',
        description: 'Get order details',
        response: {
          order_id: 'string',
          status: 'string',
          items: 'OrderItem[]',
          timeline: 'StatusChange[]',
        },
      },
      {
        method: 'PUT',
        path: '/api/orders/:id/status',
        description: 'Update order status',
        body: {
          status: 'confirmed | shipped | delivered | cancelled',
          notes: 'string (optional)',
        },
        response: {
          order_id: 'string',
          status: 'string',
        },
      },
    ],
  },
  {
    name: 'Wallet Service',
    port: 4004,
    description: 'Coins, Balance, Loyalty',
    endpoints: [
      {
        method: 'GET',
        path: '/api/wallet/balance',
        description: 'Get wallet balance',
        response: {
          balance: 'number',
          coins: 'number',
          currency: 'string',
        },
      },
      {
        method: 'POST',
        path: '/api/wallet/add',
        description: 'Add funds to wallet',
        body: {
          amount: 'number (required)',
          payment_id: 'string (required)',
        },
        response: {
          transaction_id: 'string',
          new_balance: 'number',
        },
      },
      {
        method: 'POST',
        path: '/api/wallet/spend',
        description: 'Spend from wallet',
        body: {
          amount: 'number (required)',
          description: 'string (required)',
        },
        response: {
          transaction_id: 'string',
          new_balance: 'number',
        },
      },
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function ApiReferencePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.endpoints.some(
        (ep) =>
          ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  return (
    <div className="pt-24 pb-16 px-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-4">API Reference</h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          Complete reference documentation for all REZ API endpoints. Find parameters, response
          formats, and examples for every endpoint.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </motion.div>

      {/* Services */}
      <div className="space-y-8">
        {filteredServices.map((service, serviceIndex) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: serviceIndex * 0.05 }}
            className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
          >
            {/* Service Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{service.name}</h2>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
                <span className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                  Port {service.port}
                </span>
              </div>
            </div>

            {/* Endpoints */}
            <div className="divide-y divide-white/5">
              {service.endpoints.map((endpoint) => {
                const endpointId = `${service.name}-${endpoint.path}`
                const isExpanded = expandedEndpoint === endpointId

                return (
                  <div key={endpoint.path}>
                    <button
                      onClick={() => setExpandedEndpoint(isExpanded ? null : endpointId)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold border ${methodColors[endpoint.method]}`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="flex-1 text-sm text-indigo-400 font-mono">
                        {endpoint.path}
                      </code>
                      <span className="text-sm text-gray-500">{endpoint.description}</span>
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 bg-black/20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                          {/* Request Body */}
                          {endpoint.body && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-300">
                                  Request Body
                                </h4>
                                <button
                                  onClick={() =>
                                    handleCopy(
                                      JSON.stringify(endpoint.body, null, 2),
                                      `${endpointId}-body`
                                    )
                                  }
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                                >
                                  {copiedId === `${endpointId}-body` ? (
                                    <>
                                      <Check className="w-3 h-3 text-green-400" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <CodeBlock
                                code={JSON.stringify(endpoint.body, null, 2)}
                                language="json"
                                showLineNumbers={false}
                              />
                            </div>
                          )}

                          {/* Response */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-300">
                                Response
                              </h4>
                              <button
                                onClick={() =>
                                  handleCopy(
                                    JSON.stringify(endpoint.response, null, 2),
                                    `${endpointId}-response`
                                  )
                                }
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                              >
                                {copiedId === `${endpointId}-response` ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-400" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copy
                                  </>
                                )}
                              </button>
                            </div>
                            <CodeBlock
                              code={JSON.stringify(endpoint.response, null, 2)}
                              language="json"
                              showLineNumbers={false}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-20">
          <h3 className="text-xl font-medium mb-2">No endpoints found</h3>
          <p className="text-gray-500">
            Try adjusting your search query
          </p>
        </div>
      )}
    </div>
  )
}
