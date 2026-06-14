/**
 * Premium Property Detail Page
 */
import { useState } from 'react'
import { useRouter } from 'next/router'
import PremiumNavbar from '@/components/PremiumNavbar'

export default function PropertyDetail() {
  const router = useRouter()
  const { id } = router.query
  const [activeImage, setActiveImage] = useState(0)
  const [bookingStep, setBookingStep] = useState<'idle' | 'initiating' | 'payment' | 'confirmed'>('idle')

  // Mock data
  const property = {
    id,
    title: 'Luxury 2BHK in Marina Heights',
    description: 'Stunning 2-bedroom apartment in Dubai Marina with panoramic views of the Arabian Gulf. Premium finishes, built-in wardrobes, modular kitchen, smart home features. This is one of the most sought-after properties in the area.',
    price: { amount: 2500000, currency: 'AED' },
    location: 'Dubai Marina, Dubai, UAE',
    bedrooms: 2,
    bathrooms: 2,
    carpetArea: 1450,
    propertyType: 'Apartment',
    furnished: 'Furnished',
    broker: { name: 'Ahmed Properties', phone: '+971501234567', rating: 4.8, avatar: 'https://i.pravatar.cc/150?img=33' },
    amenities: ['Pool', 'Gym', 'Beach Access', 'Concierge', 'Parking', 'Security', 'Smart Home', 'Marina View'],
    highlights: ['Premium finishing', 'Sea view', 'Close to metro', '24/7 security'],
    paymentOptions: ['Cash', 'Bank Finance', 'Crypto'],
    nearby: { metro: '5 min', beach: '10 min', mall: '15 min' }
  }

  const images = [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
  ]

  const formatPrice = (amount: number) => {
    if (amount >= 10000000) return `AED ${(amount / 10000000).toFixed(1)} Cr`
    if (amount >= 100000) return `AED ${(amount / 100000).toFixed(1)} L`
    return `AED ${amount.toLocaleString()}`
  }

  const handleBooking = () => {
    setBookingStep('initiating')
    setTimeout(() => setBookingStep('payment'), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumNavbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <a href="/" className="hover:text-primary-600">Home</a>
          <span>/</span>
          <a href="/consumer/properties" className="hover:text-primary-600">Properties</a>
          <span>/</span>
          <span className="text-gray-900">{property.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-card">
              <div className="relative h-[500px]">
                <img
                  src={images[activeImage]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-4 py-2 bg-accent-gold text-white font-bold rounded-full text-sm">
                    FEATURED
                  </span>
                  <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-800 font-semibold rounded-full text-sm">
                    {property.propertyType}
                  </span>
                </div>

                {/* Navigation */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    ←
                  </button>
                  <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                    →
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="p-4 flex gap-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImage === i ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-3xl p-8 shadow-card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <p className="text-gray-500 flex items-center gap-2">
                    📍 {property.location}
                  </p>
                </div>
                <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  ❤️
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
                <div className="text-center">
                  <div className="text-2xl mb-1">🛏️</div>
                  <div className="font-bold text-gray-900">{property.bedrooms}</div>
                  <div className="text-xs text-gray-500">Beds</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🚿</div>
                  <div className="font-bold text-gray-900">{property.bathrooms}</div>
                  <div className="text-xs text-gray-500">Baths</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">📐</div>
                  <div className="font-bold text-gray-900">{property.carpetArea}</div>
                  <div className="text-xs text-gray-500">Sq Ft</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🏠</div>
                  <div className="font-bold text-gray-900">{property.furnished}</div>
                  <div className="text-xs text-gray-500">Type</div>
                </div>
              </div>

              {/* Description */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                {property.description}
              </p>

              {/* Highlights */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Highlights</h2>
              <div className="flex flex-wrap gap-2 mb-8">
                {property.highlights.map((highlight, i) => (
                  <span key={i} className="px-4 py-2 bg-accent-emerald/10 text-accent-emerald rounded-full text-sm font-medium">
                    ✓ {highlight}
                  </span>
                ))}
              </div>

              {/* Amenities */}
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-4 gap-4">
                {property.amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600">
                    <span>✓</span>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby */}
            <div className="bg-white rounded-3xl p-8 shadow-card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Nearby</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                    🚇
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Metro Station</div>
                    <div className="text-sm text-gray-500">{property.nearby.metro} walk</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                    🏖️
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Beach</div>
                    <div className="text-sm text-gray-500">{property.nearby.beach} walk</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">
                    🛍️
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Mall</div>
                    <div className="text-sm text-gray-500">{property.nearby.mall} drive</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-3xl p-6 shadow-card">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatPrice(property.price.amount)}
                </div>
                <p className="text-gray-500 text-sm mb-6">Inclusive of VAT</p>

                {/* Booking Steps */}
                {bookingStep === 'idle' && (
                  <button
                    onClick={handleBooking}
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-2xl hover:shadow-lg transition-all"
                  >
                    Book Site Visit
                  </button>
                )}

                {bookingStep === 'initiating' && (
                  <button disabled className="w-full py-4 bg-gray-200 text-gray-600 font-semibold rounded-2xl">
                    Processing...
                  </button>
                )}

                {bookingStep === 'payment' && (
                  <button className="w-full py-4 bg-gradient-to-r from-accent-emerald to-accent-emerald text-white font-semibold rounded-2xl hover:shadow-lg transition-all">
                    Pay Token Amount
                  </button>
                )}

                <div className="mt-4 flex gap-3">
                  <button className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    💬 WhatsApp
                  </button>
                  <button className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    📞 Call
                  </button>
                </div>

                {/* Golden Visa Badge */}
                <div className="mt-6 p-4 bg-accent-gold/10 rounded-2xl">
                  <div className="flex items-center gap-2 text-accent-gold font-semibold mb-1">
                    🌟 Golden Visa Eligible
                  </div>
                  <p className="text-sm text-gray-600">
                    Property value qualifies for 10-year UAE residency
                  </p>
                </div>
              </div>

              {/* Agent Card */}
              <div className="bg-white rounded-3xl p-6 shadow-card">
                <h3 className="font-semibold text-gray-900 mb-4">Listed by</h3>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={property.broker.avatar}
                    alt={property.broker.name}
                    className="w-14 h-14 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{property.broker.name}</div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      ⭐ {property.broker.rating} Rating
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${property.broker.phone}`}
                  className="block w-full py-3 bg-gray-100 text-gray-900 font-medium rounded-xl text-center hover:bg-gray-200 transition-colors"
                >
                  📞 {property.broker.phone}
                </a>
              </div>

              {/* Calculator Card */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-6 text-white">
                <h3 className="font-semibold mb-2">💰 Home Loan Calculator</h3>
                <p className="text-white/80 text-sm mb-4">Check your monthly EMI</p>
                <a
                  href="/consumer/calculator"
                  className="block w-full py-3 bg-white text-primary-600 font-semibold rounded-xl text-center hover:bg-gray-100 transition-colors"
                >
                  Calculate EMI
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
