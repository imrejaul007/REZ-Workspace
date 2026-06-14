'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Book,
  Key,
  Webhook,
  Gauge,
  AlertCircle,
  Layers,
  Code2,
  FileText,
  GitBranch,
} from 'lucide-react'

const docs = [
  {
    icon: Book,
    title: 'Introduction',
    description: 'Learn the basics of the REZ API ecosystem',
    href: '/docs/introduction',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Key,
    title: 'Authentication',
    description: 'Secure your API requests with JWT and API keys',
    href: '/docs/authentication',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Code2,
    title: 'Quick Start',
    description: 'Make your first API call in minutes',
    href: '/docs/quick-start',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Layers,
    title: 'API Overview',
    description: 'Explore all available services and endpoints',
    href: '/docs/api-overview',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Webhook,
    title: 'Webhooks',
    description: 'Receive real-time notifications for events',
    href: '/docs/webhooks',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Gauge,
    title: 'Rate Limits',
    description: 'Understand request limits and best practices',
    href: '/docs/rate-limits',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: AlertCircle,
    title: 'Error Codes',
    description: 'Troubleshoot common errors and issues',
    href: '/docs/error-codes',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: GitBranch,
    title: 'Changelog',
    description: 'Stay updated with the latest changes',
    href: '/docs/changelog',
    color: 'from-teal-500 to-cyan-500',
  },
]

export default function DocsPage() {
  return (
    <div className="pt-24 pb-16 px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium mb-4">
            <Book className="w-4 h-4" />
            Documentation
          </div>
          <h1 className="text-4xl font-bold mb-4">REZ API Documentation</h1>
          <p className="text-xl text-gray-400 max-w-2xl">
            Everything you need to integrate powerful payment, authentication, and commerce APIs
            into your applications.
          </p>
        </motion.div>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map((doc, index) => (
          <motion.div
            key={doc.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Link
              href={doc.href}
              className="group block p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <doc.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-indigo-400 transition-colors">
                      {doc.title}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-sm text-gray-500">{doc.description}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
        <p className="text-gray-400 mb-6">
          Can not find what you are looking for? Check out our API reference or playground.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/api-reference"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            API Reference
          </Link>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Code2 className="w-4 h-4" />
            API Playground
          </Link>
          <Link
            href="/sdks"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            SDK Documentation
          </Link>
        </div>
      </div>
    </div>
  )
}
