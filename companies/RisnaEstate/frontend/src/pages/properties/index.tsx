import { logger } from '../../logger';
import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface Property {
  _id: string
  title: string
  country: string
  city: string
  locality: string
  propertyType: string
  listingType: string
  price: { amount: number; currency: string }
  bedrooms?: number
  bathrooms?: number
  carpetArea?: number
  furnishedStatus?: string
  amenities?: string[]
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    country: '',
    city: '',
    propertyType: '',
    listingType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: ''
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      const res = await axios.get(`${API_URL}/api/v1/properties?${params}`)
      setProperties(res.data.data || [])
    } catch (err) {
      logger.error('Failed to fetch properties:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchProperties()
  }

  const formatPrice = (price: { amount: number; currency: string }) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency === 'AED' ? 'AED' : 'INR',
      maximumFractionDigits: 0
    })
    return formatter.format(price.amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-xl font-bold">RisnaEstate</span>
            </div>
            <nav className="flex gap-6">
              <a href="/properties" className="text-primary-600 font-medium">Properties</a>
              <a href="/dashboard" className="text-gray-600">Dashboard</a>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Search Properties</h2>
          <form onSubmit={handleSearch} className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <select
              className="border rounded-lg px-4 py-2"
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            >
              <option value="">Country</option>
              <option value="AE">UAE</option>
              <option value="IN">India</option>
            </select>
            <input
              type="text"
              placeholder="City"
              className="border rounded-lg px-4 py-2"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            />
            <select
              className="border rounded-lg px-4 py-2"
              value={filters.propertyType}
              onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
            >
              <option value="">Property Type</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="penthouse">Penthouse</option>
            </select>
            <select
              className="border rounded-lg px-4 py-2"
              value={filters.listingType}
              onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}
            >
              <option value="">Listing Type</option>
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
            <input
              type="number"
              placeholder="Min Budget"
              className="border rounded-lg px-4 py-2"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            />
            <button
              type="submit"
              className="bg-primary-600 text-white rounded-lg px-6 py-2 hover:bg-primary-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="mb-4">
          <span className="text-gray-600">{properties.length} properties found</span>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No properties found</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="bg-gray-200 border-2 border-dashed rounded-t-xl h-48" />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                      {property.country === 'AE' ? 'UAE' : 'India'}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {property.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{property.title}</h3>
                  <p className="text-gray-500 text-sm mb-3">{property.locality}, {property.city}</p>
                  <div className="flex gap-4 text-sm text-gray-600 mb-4">
                    {property.bedrooms && <span>{property.bedrooms} BHK</span>}
                    {property.bathrooms && <span>{property.bathrooms} Bath</span>}
                    {property.carpetArea && <span>{property.carpetArea} sqft</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-primary-600">
                      {formatPrice(property.price)}
                    </span>
                    <a
                      href={`/properties/${property._id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
