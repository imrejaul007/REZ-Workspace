/**
 * Consumer Portal - Properties Page
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'
import Link from 'next/link'

export default function ConsumerProperties() {
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    type: '',
    purpose: 'buy'
  })

  return (
    <PortalLayout portal="consumer">
      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h3 className="font-semibold mb-4">Filters</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Country</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                >
                  <option value="">All Countries</option>
                  <option value="AE">UAE</option>
                  <option value="IN">India</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">City</label>
                <input
                  type="text"
                  placeholder="e.g. Dubai, Bangalore"
                  className="w-full border rounded-lg px-3 py-2"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Property Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="villa">Villa</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Budget</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" className="w-full border rounded-lg px-3 py-2" />
                  <input type="number" placeholder="Max" className="w-full border rounded-lg px-3 py-2" />
                </div>
              </div>

              <button className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Properties</h1>
            <div className="flex gap-2">
              <button className="px-4 py-2 border rounded-lg text-sm">Grid</button>
              <button className="px-4 py-2 border rounded-lg text-sm">List</button>
              <button className="px-4 py-2 border rounded-lg text-sm">Map</button>
            </div>
          </div>

          <p className="text-gray-600 mb-6">Found 24 properties</p>

          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="bg-gray-200 h-48 relative">
                  <span className="absolute top-3 left-3 bg-white px-2 py-1 rounded text-xs font-medium">FEATURED</span>
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span>♡</span>
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex gap-2 mb-2">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">UAE</span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">For Sale</span>
                  </div>
                  <h3 className="font-semibold text-lg">Luxury 2BHK in Marina Heights</h3>
                  <p className="text-gray-500 text-sm">Dubai Marina, Dubai</p>
                  <div className="flex gap-4 text-sm text-gray-600 my-3">
                    <span>2 BHK</span>
                    <span>2 Bath</span>
                    <span>1,450 sqft</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <p className="text-xl font-bold text-primary-600">AED 2,500,000</p>
                    <Link href={`/consumer/properties/${i}`} className="text-primary-600 text-sm font-medium hover:underline">
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-8">
            <button className="px-4 py-2 border rounded-lg">Previous</button>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg">1</button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">2</button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">3</button>
            <button className="px-4 py-2 border rounded-lg">Next</button>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
