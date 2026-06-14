/**
 * Premium Property Card Component
 */
import Link from 'next/link'

interface PropertyCardProps {
  property: {
    id: string
    title: string
    price: { amount: number; currency: string }
    location: string
    bedrooms: number
    bathrooms: number
    area: number
    images?: string[]
    type?: string
    featured?: boolean
  }
  variant?: 'default' | 'compact' | 'horizontal'
}

export default function PropertyCard({ property, variant = 'default' }: PropertyCardProps) {
  const formatPrice = (amount: number, currency: string) => {
    const symbol = currency === 'AED' ? 'AED ' : '₹'
    if (amount >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(1)}Cr`
    }
    if (amount >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(1)}L`
    }
    return `${symbol}${amount.toLocaleString()}`
  }

  const defaultImage = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/consumer/property/${property.id}`}
        className="group flex bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
      >
        <div className="w-72 h-48 relative flex-shrink-0">
          <img
            src={property.images?.[0] || defaultImage}
            alt={property.title}
            className="w-full h-full object-cover"
          />
          {property.featured && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-accent-gold text-white text-xs font-bold rounded-full">
              FEATURED
            </span>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">
              {property.title}
            </h3>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              📍 {property.location}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(property.price.amount, property.price.currency)}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>🛏️ {property.bedrooms}</span>
              <span>🚿 {property.bathrooms}</span>
              <span>📐 {property.area}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/consumer/property/${property.id}`}
        className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all"
      >
        <div className="h-36 relative">
          <img
            src={property.images?.[0] || defaultImage}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {property.featured && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-accent-gold text-white text-xs font-bold rounded-full">
              FEATURED
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm truncate">{property.title}</h3>
          <p className="text-primary-600 font-bold mt-1">
            {formatPrice(property.price.amount, property.price.currency)}
          </p>
        </div>
      </Link>
    )
  }

  // Default variant
  return (
    <Link
      href={`/consumer/property/${property.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
    >
      <div className="h-56 relative overflow-hidden">
        <img
          src={property.images?.[0] || defaultImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.featured && (
            <span className="px-3 py-1 bg-accent-gold text-white text-xs font-bold rounded-full">
              FEATURED
            </span>
          )}
          {property.type && (
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
              {property.type}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
          ❤️
        </button>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <div className="text-white text-2xl font-bold drop-shadow-lg">
            {formatPrice(property.price.amount, property.price.currency)}
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
          {property.title}
        </h3>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
          📍 {property.location}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="text-base">🛏️</span>
            <span>{property.bedrooms} Beds</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="text-base">🚿</span>
            <span>{property.bathrooms} Baths</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className="text-base">📐</span>
            <span>{property.area.toLocaleString()} sqft</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
