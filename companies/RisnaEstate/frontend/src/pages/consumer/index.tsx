/**
 * RisnaEstate - Premium Home Page
 * Modern, luxury real estate design
 */
import PortalLayout from '@/layouts/PortalLayout'
import Link from 'next/link'
import { useState } from 'react'

// Property data
const FEATURED_PROPERTIES = [
  { id: 1, title: 'Palm Jumeirah Signature Villa', price: 45000000, currency: 'AED', beds: 5, baths: 6, area: 8500, location: 'Palm Jumeirah, Dubai', type: 'Villa', featured: true, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800' },
  { id: 2, title: 'Marina Luxe Penthouse', price: 18500000, currency: 'AED', beds: 4, baths: 5, area: 5200, location: 'Dubai Marina', type: 'Penthouse', featured: true, image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' },
  { id: 3, title: 'Downtown Executive Suite', price: 8500000, currency: 'AED', beds: 2, baths: 3, area: 1800, location: 'Downtown Dubai', type: 'Apartment', featured: true, image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
]

const STATS = [
  { value: '2,500+', label: 'Properties', icon: '🏠' },
  { value: '500+', label: 'Verified Brokers', icon: '👔' },
  { value: '₹50Cr+', label: 'Transactions', icon: '💰' },
  { value: '98%', label: 'Happy Clients', icon: '⭐' },
]

const FEATURES = [
  { title: 'AI Property Matching', desc: 'Smart recommendations based on your preferences', icon: '🤖' },
  { title: 'Golden Visa Support', desc: 'Expert guidance for UAE residency', icon: '🌍' },
  { title: 'Secure Transactions', desc: 'Escrow protection on all payments', icon: '🔒' },
  { title: 'Virtual Tours', desc: 'Explore properties from anywhere', icon: '🎥' },
]

const LOCATION_CARDS = [
  { name: 'Dubai Marina', count: 450, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600' },
  { name: 'Palm Jumeirah', count: 280, image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600' },
  { name: 'Downtown Dubai', count: 320, image: 'https://images.unsplash.com/photo-1546412414-e1885259563a?w=600' },
  { name: 'Business Bay', count: 180, image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600' },
]

export default function ConsumerPortal() {
  const [searchType, setSearchType] = useState('buy')

  return (
    <PortalLayout portal="consumer">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark-900 via-primary-900 to-dark-800">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-gold rounded-full blur-3xl animate-float-slow" />
        </div>

        {/* Geometric Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-accent-emerald rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">Trusted by 10,000+ property buyers</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 animate-slide-up">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-gold">Dream Property</span>
          </h1>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-12 animate-slide-up">
            AI-powered property discovery for Dubai & India. Personalized recommendations, Golden Visa support, and seamless transactions.
          </p>

          {/* Search Box */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-2 animate-scale-in">
            <div className="flex gap-2 mb-4 px-2 pt-2">
              {['buy', 'rent', 'invest'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSearchType(type)}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                    searchType === type
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-2xl">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                <input
                  type="text"
                  placeholder="Location, Area, or Project"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-0 bg-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <select className="px-4 py-4 rounded-xl border-0 bg-white min-w-[140px]">
                  <option>Property Type</option>
                  <option>Apartment</option>
                  <option>Villa</option>
                  <option>Penthouse</option>
                </select>
                <select className="px-4 py-4 rounded-xl border-0 bg-white min-w-[120px]">
                  <option>Budget</option>
                  <option>Under 5M</option>
                  <option>5M - 10M</option>
                  <option>10M - 25M</option>
                  <option>25M+</option>
                </select>
              </div>
              <button className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:shadow-glow transition-all flex items-center justify-center gap-2">
                <span>🔍</span> Search
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 animate-fade-in">
            <Link href="/consumer/visa" className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm">
              🌟 Golden Visa Check
            </Link>
            <Link href="/consumer/calculator" className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm">
              💰 EMI Calculator
            </Link>
            <Link href="/consumer/referrals" className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm">
              🎁 Earn Rewards
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-dark-900 mb-1">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Handpicked</span>
              <h2 className="text-4xl font-display font-bold text-dark-900 mt-2">Featured Properties</h2>
            </div>
            <Link href="/consumer/properties" className="hidden md:flex items-center gap-2 text-primary-600 font-semibold hover:gap-4 transition-all">
              View All <span>→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURED_PROPERTIES.map((property, i) => (
              <Link
                key={property.id}
                href={`/consumer/property/${property.id}`}
                className="group bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-accent-gold text-white text-xs font-bold rounded-full">
                      FEATURED
                    </span>
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full">
                      {property.type}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white text-2xl font-bold">
                      {property.currency === 'AED' ? 'AED ' : '₹'}{property.price.toLocaleString()}
                    </div>
                  </div>
                  {/* Wishlist */}
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                    ❤️
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {property.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                    <span>📍</span> {property.location}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">🛏️ {property.beds} Beds</span>
                    <span className="flex items-center gap-1">🚿 {property.baths} Baths</span>
                    <span className="flex items-center gap-1">📐 {property.area.toLocaleString()} sqft</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link href="/consumer/properties" className="md:hidden flex items-center justify-center gap-2 text-primary-600 font-semibold mt-8">
            View All Properties <span>→</span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-4xl font-display font-bold text-dark-900 mt-2">The RisnaEstate Advantage</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {FEATURES.map((feature, i) => (
              <div key={i} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-50 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 group-hover:bg-primary-600 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-20 bg-gradient-to-br from-dark-900 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary-300 font-semibold text-sm uppercase tracking-wider">Explore</span>
            <h2 className="text-4xl font-display font-bold mt-2">Popular Locations</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {LOCATION_CARDS.map((location, i) => (
              <Link
                key={i}
                href={`/consumer/properties?location=${encodeURIComponent(location.name)}`}
                className="group relative h-72 rounded-3xl overflow-hidden"
              >
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-xl font-bold text-white mb-1">{location.name}</h3>
                  <p className="text-white/70 text-sm">{location.count}+ properties</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-12 text-white relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-gold/20 rounded-full blur-2xl" />

            <div className="relative z-10">
              <span className="text-6xl mb-4 block">🌟</span>
              <h2 className="text-4xl font-display font-bold mb-4">Ready to Invest in Dubai?</h2>
              <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
                Check your Golden Visa eligibility and get personalized property recommendations from our AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/consumer/visa" className="px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                  Check Visa Eligibility
                </Link>
                <Link href="/consumer/calculator" className="px-8 py-4 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors">
                  Calculate EMI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PortalLayout>
  )
}
