'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-lg font-semibold mb-8 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About Resturistan</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connecting restaurants, employees, and vendors in one comprehensive platform
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600">
                To revolutionize the restaurant industry by providing a unified platform that connects 
                restaurant owners, employees, and vendors, streamlining operations and fostering growth.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600">
                To become the leading platform that empowers restaurant businesses to thrive through 
                technology, community, and seamless collaboration.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">What We Offer</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">For Restaurants</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Job posting and hiring</li>
                  <li>• Staff management</li>
                  <li>• Order management</li>
                  <li>• Analytics and insights</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">For Employees</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Job discovery</li>
                  <li>• Career development</li>
                  <li>• Skill management</li>
                  <li>• Community networking</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">For Vendors</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Product marketplace</li>
                  <li>• Order management</li>
                  <li>• Customer insights</li>
                  <li>• Business growth tools</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/auth/register" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold">
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  )
}