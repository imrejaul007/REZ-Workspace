/**
 * RisnaEstate - Portal Selector Landing Page
 */
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>RisnaEstate - AI-Powered Real Estate OS</title>
        <meta name="description" content="One platform for Consumers, Brokers, and Builders" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RisnaEstate</span>
            </div>
            <nav className="flex gap-6">
              <Link href="/auth/login" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Real Estate OS
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            One platform for everyone — Buyers, Brokers, and Builders.
          </p>
        </div>
      </section>

      {/* Portal Selector */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Choose Your Portal</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Consumer Portal */}
            <Link href="/consumer" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition group">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Consumer Portal</h3>
              <p className="text-gray-600 mb-4">Find your dream property. Search, compare, and buy or rent.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Property search</li>
                <li>• Visa eligibility check</li>
                <li>• Refer & earn rewards</li>
                <li>• Site visit booking</li>
              </ul>
              <div className="mt-6 text-primary-600 font-medium group-hover:text-primary-700">
                Enter Portal →
              </div>
            </Link>

            {/* Broker Portal */}
            <Link href="/broker" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition group border-2 border-green-500">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition">
                <span className="text-3xl">👔</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Broker Portal</h3>
              <p className="text-gray-600 mb-4">Manage leads, track commissions, and grow your business.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Lead management</li>
                <li>• CRM & follow-ups</li>
                <li>• Commission tracking</li>
                <li>• Team management</li>
              </ul>
              <div className="mt-6 text-green-600 font-medium group-hover:text-green-700">
                Enter Portal →
              </div>
            </Link>

            {/* Admin Portal */}
            <Link href="/admin/portal" className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition group border-2 border-purple-500">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition">
                <span className="text-3xl">⚙️</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Admin Portal</h3>
              <p className="text-gray-600 mb-4">System administration and analytics.</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• User management</li>
                <li>• Broker verification</li>
                <li>• Platform analytics</li>
                <li>• System settings</li>
              </ul>
              <div className="mt-6 text-purple-600 font-medium group-hover:text-purple-700">
                Enter Portal →
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Built on REZ Ecosystem</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <h4 className="font-semibold mb-1">AI Powered</h4>
              <p className="text-sm text-gray-500">Smart recommendations</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">🔐</span>
              </div>
              <h4 className="font-semibold mb-1">Secure</h4>
              <p className="text-sm text-gray-500">Bank-grade security</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">🌍</span>
              </div>
              <h4 className="font-semibold mb-1">UAE + India</h4>
              <p className="text-sm text-gray-500">Cross-border support</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <h4 className="font-semibold mb-1">Integrated</h4>
              <p className="text-sm text-gray-500">Payments & wallet</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 RisnaEstate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
