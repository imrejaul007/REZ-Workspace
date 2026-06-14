'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Book,
  Code2,
  Layers,
  Zap,
  Shield,
  Globe,
  Terminal,
  Rocket,
  Users,
  GitBranch,
  Package,
  Key
} from 'lucide-react'

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Blazing Fast',
    description: 'Optimized APIs with <50ms response times and global edge deployment.'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant, end-to-end encryption, and advanced fraud protection.'
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Global Scale',
    description: 'Multi-region infrastructure with 99.99% uptime SLA.'
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: 'Developer First',
    description: 'Comprehensive SDKs, detailed docs, and sandbox environments.'
  }
]

const services = [
  { name: 'Authentication', port: 4002, description: 'JWT, OTP, MFA, OAuth 2.0', slug: 'auth' },
  { name: 'Payments', port: 4001, description: 'Razorpay, UPI, Wallets', slug: 'payments' },
  { name: 'Orders', port: 4006, description: 'Order lifecycle, FSM, tracking', slug: 'orders' },
  { name: 'Catalog', port: 4007, description: 'Products, Inventory, Pricing', slug: 'catalog' },
  { name: 'Search', port: 4008, description: 'Full-text, Autocomplete', slug: 'search' },
  { name: 'Notifications', port: 4011, description: 'Push, SMS, Email, WhatsApp', slug: 'notifications' },
  { name: 'Analytics', port: 4016, description: 'Dashboards, Real-time metrics', slug: 'analytics' },
  { name: 'Wallet', port: 4004, description: 'Coins, Balance, Loyalty', slug: 'wallet' },
]

const quickLinks = [
  { icon: <Book className="w-5 h-5" />, title: 'Documentation', href: '/docs', desc: 'Learn the basics' },
  { icon: <Code2 className="w-5 h-5" />, title: 'API Reference', href: '/api-reference', desc: 'Complete API docs' },
  { icon: <Terminal className="w-5 h-5" />, title: 'Playground', href: '/playground', desc: 'Test APIs live' },
  { icon: <Package className="w-5 h-5" />, title: 'SDKs', href: '/sdks', desc: 'Client libraries' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-purple-900/20" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium mb-8">
              <GitBranch className="w-4 h-4" />
              Version 2.0 Now Available
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-7xl font-bold mb-6"
          >
            Build with{' '}
            <span className="gradient-text">REZ API</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto mb-12"
          >
            Integrate powerful payment, authentication, and commerce APIs into your applications.
            Ship faster with our comprehensive SDKs and sandbox environment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all hover:scale-105"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 font-semibold rounded-lg transition-all"
            >
              <Terminal className="w-5 h-5" /> Try API
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group p-6 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all hover:bg-white/10"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/30 transition-colors">
                  {link.icon}
                </div>
                <h3 className="font-semibold mb-1">{link.title}</h3>
                <p className="text-sm text-gray-500">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Production-ready APIs with comprehensive documentation and developer tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">API Services</h2>
              <p className="text-gray-400">Explore our suite of enterprise-grade APIs.</p>
            </div>
            <Link
              href="/api-reference"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/docs/${service.slug}`}
                className="group p-5 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold group-hover:text-indigo-400 transition-colors">
                    {service.name}
                  </h3>
                  <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">
                    :{service.port}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{service.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Start Building <span className="gradient-text">In Minutes</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Our SDKs handle authentication, retries, and error handling so you can focus on your product.
              </p>
              <ul className="space-y-4">
                {[
                  'Automatic request retries with exponential backoff',
                  'Built-in rate limit handling',
                  'TypeScript support with full type definitions',
                  'Comprehensive error handling',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl" />
              <div className="relative rounded-xl bg-[#0d0d14] border border-white/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-xs text-gray-500">install-sdk.ts</span>
                </div>
                <pre className="p-4 text-sm overflow-x-auto border-0 bg-transparent">
                  <code className="text-gray-300">
{`import { ReZClient } from '@rez/sdk';

const client = new ReZClient({
  apiKey: process.env.REZ_API_KEY,
  environment: 'sandbox'
});

// Create a payment
const payment = await client.payments.create({
  amount: 49900,
  currency: 'INR',
  receipt: 'order_123',
  customer: {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+919876543210'
  }
});

console.log(payment.id); // pay_xxxxxx`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-medium mb-8">
            <Rocket className="w-4 h-4" />
            Free Sandbox - No Credit Card Required
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Build Something <span className="gradient-text">Amazing</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of developers building the next generation of commerce applications.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all hover:scale-105"
            >
              <Book className="w-5 h-5" /> Read Documentation
            </Link>
            <Link
              href="https://github.com/imrejaul007"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 font-semibold rounded-lg transition-all"
            >
              <Users className="w-5 h-5" /> Join Community
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
                R
              </div>
              <span className="font-semibold">REZ Developer Portal</span>
            </div>
            <p className="text-gray-500 text-sm">
              Built with care for developers worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
