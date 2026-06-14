'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Copy,
  Check,
  Terminal,
  Globe,
  Smartphone,
  Monitor,
} from 'lucide-react'
import { CodeBlock } from '@/components/CodeBlock'

const sdks = [
  {
    name: 'JavaScript / TypeScript',
    icon: Globe,
    color: 'from-yellow-400 to-orange-500',
    package: '@rez/sdk',
    install: 'npm install @rez/sdk',
    versions: ['v2.0.0 (latest)', 'v1.9.2', 'v1.9.0'],
    features: ['Full TypeScript support', 'Tree-shakeable', 'ESM & CJS', 'Auto-complete'],
    code: `import { ReZClient } from '@rez/sdk';

const client = new ReZClient({
  apiKey: process.env.REZ_API_KEY,
  environment: 'sandbox'
});

// Verify a token
const result = await client.auth.verifyToken({
  token: 'jwt-token-here'
});

// Create a payment
const payment = await client.payments.create({
  amount: 49900,
  currency: 'INR',
  customer: {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+919876543210'
  }
});`,
  },
  {
    name: 'Node.js',
    icon: Monitor,
    color: 'from-green-400 to-emerald-500',
    package: '@rez/sdk-node',
    install: 'npm install @rez/sdk-node',
    versions: ['v2.0.0 (latest)', 'v1.9.2'],
    features: ['Promise-based API', 'Built-in retry logic', 'Streaming support'],
    code: `const { ReZNode } = require('@rez/sdk-node');

const client = new ReZNode({
  apiKey: process.env.REZ_API_KEY,
  timeout: 30000,
  retries: 3
});

// Create order
const order = await client.orders.create({
  customer_id: 'cust_123',
  items: [
    { product_id: 'prod_abc', quantity: 2, price: 24950 }
  ],
  shipping_address: {
    line1: '123 Main Street',
    city: 'Mumbai',
    state: 'MH',
    pincode: '400001'
  }
});`,
  },
  {
    name: 'React Native',
    icon: Smartphone,
    color: 'from-blue-400 to-indigo-500',
    package: '@rez/sdk-react-native',
    install: 'npm install @rez/sdk-react-native',
    versions: ['v2.0.0 (latest)', 'v1.9.0'],
    features: ['React hooks', 'Offline support', 'Secure storage'],
    code: `import { useReZ, useAuth, usePayments } from '@rez/sdk-react-native';

function CheckoutScreen() {
  const { createPayment, loading, error } = usePayments();

  const handlePayment = async () => {
    const payment = await createPayment({
      amount: 49900,
      currency: 'INR',
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

    // Handle success
    console.log('Payment:', payment.id);
  };

  return (
    <Button onPress={handlePayment} loading={loading}>
      Pay ₹499
    </Button>
  );
}`,
  },
]

const frameworks = [
  { name: 'Next.js', badge: 'Official' },
  { name: 'Express.js', badge: 'Official' },
  { name: 'Fastify', badge: 'Community' },
  { name: 'NestJS', badge: 'Community' },
  { name: 'Remix', badge: 'Community' },
]

export default function SDKsPage() {
  const [selectedSDK, setSelectedSDK] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const currentSDK = sdks[selectedSDK]

  return (
    <div className="pt-24 pb-16 px-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium mb-4">
          <Package className="w-4 h-4" />
          Official SDKs
        </div>
        <h1 className="text-4xl font-bold mb-4">SDK Documentation</h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          Official client libraries to integrate REZ APIs into your application. All SDKs are
          open source and fully typed.
        </p>
      </motion.div>

      {/* SDK Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex flex-wrap gap-3">
          {sdks.map((sdk, index) => (
            <button
              key={sdk.name}
              onClick={() => setSelectedSDK(index)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                selectedSDK === index
                  ? 'bg-white/10 border-indigo-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sdk.color} flex items-center justify-center`}
              >
                <sdk.icon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">{sdk.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* SDK Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Code Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="ml-2 text-xs text-gray-500 font-mono">
                    example.ts
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(currentSDK.code, 'code')}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                >
                  {copied === 'code' ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-4">
              <CodeBlock code={currentSDK.code} language="typescript" />
            </div>
          </div>
        </motion.div>

        {/* SDK Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Installation */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Installation</h3>
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 text-sm font-mono text-indigo-400 bg-[#0d0d14] px-3 py-2 rounded-lg">
                {currentSDK.install}
              </code>
              <button
                onClick={() => handleCopy(currentSDK.install, 'install')}
                className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-white/10 transition-colors"
              >
                {copied === 'install' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Package */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Package</h3>
            <code className="text-sm font-mono text-indigo-400">{currentSDK.package}</code>
          </div>

          {/* Versions */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Versions</h3>
            <div className="space-y-2">
              {currentSDK.versions.map((version) => (
                <div
                  key={version}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-mono text-gray-300">{version}</span>
                  {version.includes('latest') && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      Stable
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Features</h3>
            <ul className="space-y-2">
              {currentSDK.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>

      {/* Framework Support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-12"
      >
        <h2 className="text-2xl font-bold mb-6">Framework Support</h2>
        <div className="flex flex-wrap gap-3">
          {frameworks.map((framework) => (
            <div
              key={framework.name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
            >
              <Terminal className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{framework.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  framework.badge === 'Official'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {framework.badge}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Community SDKs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20"
      >
        <h2 className="text-2xl font-bold mb-4">Community SDKs</h2>
        <p className="text-gray-400 mb-6">
          Looking for other languages? Our community has built SDKs for Python, Ruby, Go, and
          more.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="#"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            Python SDK (Community)
          </a>
          <a
            href="#"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            Ruby SDK (Community)
          </a>
          <a
            href="#"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            Go SDK (Community)
          </a>
          <a
            href="#"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            PHP SDK (Community)
          </a>
          <a
            href="#"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            Java SDK (Community)
          </a>
        </div>
      </motion.div>
    </div>
  )
}
