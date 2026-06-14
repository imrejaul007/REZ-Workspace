'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  CheckCircleIcon,
  TruckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'

interface Restaurant {
  id: number
  name: string
  cuisine: string[]
  description: string
  address: string
  phone: string
  rating: number
  reviewCount: number
  priceRange: string
  deliveryTime: string
  minimumOrder: number
  deliveryFee: number
  verified: boolean
  openNow: boolean
  image: string
  specialties: string[]
  openingHours: {
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
  }
  features: string[]
  activeJobs: number
  employees: number
}

const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: 'Bella Italia Ristorante',
    cuisine: ['Italian', 'Mediterranean'],
    description: 'Authentic Italian cuisine with fresh ingredients and traditional recipes passed down through generations.',
    address: '123 Main Street, San Francisco, CA 94102',
    phone: '(415) 555-0123',
    rating: 4.8,
    reviewCount: 342,
    priceRange: '$$$',
    deliveryTime: '30-45 min',
    minimumOrder: 25,
    deliveryFee: 3.99,
    verified: true,
    openNow: true,
    image: '🍝',
    specialties: ['Handmade Pasta', 'Wood-fired Pizza', 'Tiramisu'],
    openingHours: {
      monday: '11:00 AM - 10:00 PM',
      tuesday: '11:00 AM - 10:00 PM',
      wednesday: '11:00 AM - 10:00 PM',
      thursday: '11:00 AM - 10:00 PM',
      friday: '11:00 AM - 11:00 PM',
      saturday: '11:00 AM - 11:00 PM',
      sunday: '12:00 PM - 9:00 PM'
    },
    features: ['Outdoor Seating', 'Wine Bar', 'Catering'],
    activeJobs: 3,
    employees: 24
  },
  {
    id: 2,
    name: 'Tokyo Sushi Bar',
    cuisine: ['Japanese', 'Sushi'],
    description: 'Premium sushi and Japanese cuisine featuring fresh daily fish and traditional preparation methods.',
    address: '456 Market Street, San Francisco, CA 94105',
    phone: '(415) 555-0456',
    rating: 4.9,
    reviewCount: 521,
    priceRange: '$$$$',
    deliveryTime: '45-60 min',
    minimumOrder: 40,
    deliveryFee: 4.99,
    verified: true,
    openNow: true,
    image: '🍣',
    specialties: ['Omakase', 'Fresh Sashimi', 'Sake Selection'],
    openingHours: {
      monday: 'Closed',
      tuesday: '5:00 PM - 10:00 PM',
      wednesday: '5:00 PM - 10:00 PM',
      thursday: '5:00 PM - 10:00 PM',
      friday: '5:00 PM - 11:00 PM',
      saturday: '5:00 PM - 11:00 PM',
      sunday: '5:00 PM - 9:00 PM'
    },
    features: ['Omakase Menu', 'Sake Bar', 'Private Dining'],
    activeJobs: 1,
    employees: 18
  },
  {
    id: 3,
    name: 'The Grill House',
    cuisine: ['American', 'Steakhouse'],
    description: 'Premium steakhouse serving USDA Prime beef and fresh seafood in an upscale atmosphere.',
    address: '789 Union Square, San Francisco, CA 94108',
    phone: '(415) 555-0789',
    rating: 4.6,
    reviewCount: 289,
    priceRange: '$$$$',
    deliveryTime: '40-55 min',
    minimumOrder: 50,
    deliveryFee: 5.99,
    verified: true,
    openNow: false,
    image: '🥩',
    specialties: ['Dry-aged Steaks', 'Fresh Lobster', 'Wine Selection'],
    openingHours: {
      monday: '5:00 PM - 10:00 PM',
      tuesday: '5:00 PM - 10:00 PM',
      wednesday: '5:00 PM - 10:00 PM',
      thursday: '5:00 PM - 10:00 PM',
      friday: '5:00 PM - 11:00 PM',
      saturday: '5:00 PM - 11:00 PM',
      sunday: '5:00 PM - 9:00 PM'
    },
    features: ['Valet Parking', 'Wine Cellar', 'Business Dining'],
    activeJobs: 5,
    employees: 32
  },
  {
    id: 4,
    name: 'Café Parisien',
    cuisine: ['French', 'Cafe'],
    description: 'Charming French bistro offering classic dishes, pastries, and an extensive wine collection.',
    address: '321 Nob Hill, San Francisco, CA 94109',
    phone: '(415) 555-0321',
    rating: 4.7,
    reviewCount: 198,
    priceRange: '$$$',
    deliveryTime: '25-35 min',
    minimumOrder: 20,
    deliveryFee: 2.99,
    verified: true,
    openNow: true,
    image: '🥐',
    specialties: ['Croissants', 'French Onion Soup', 'Crème Brûlée'],
    openingHours: {
      monday: '7:00 AM - 9:00 PM',
      tuesday: '7:00 AM - 9:00 PM',
      wednesday: '7:00 AM - 9:00 PM',
      thursday: '7:00 AM - 9:00 PM',
      friday: '7:00 AM - 10:00 PM',
      saturday: '8:00 AM - 10:00 PM',
      sunday: '8:00 AM - 8:00 PM'
    },
    features: ['Breakfast Menu', 'Outdoor Seating', 'French Wine'],
    activeJobs: 2,
    employees: 16
  },
  {
    id: 5,
    name: 'Spice Route Indian',
    cuisine: ['Indian', 'Vegetarian'],
    description: 'Authentic Indian flavors with traditional spices and modern presentation in a warm atmosphere.',
    address: '654 Mission Street, San Francisco, CA 94103',
    phone: '(415) 555-0654',
    rating: 4.5,
    reviewCount: 167,
    priceRange: '$$',
    deliveryTime: '35-50 min',
    minimumOrder: 18,
    deliveryFee: 2.49,
    verified: false,
    openNow: true,
    image: '🍛',
    specialties: ['Tandoor Dishes', 'Biryani', 'Vegetarian Options'],
    openingHours: {
      monday: '11:00 AM - 9:30 PM',
      tuesday: '11:00 AM - 9:30 PM',
      wednesday: '11:00 AM - 9:30 PM',
      thursday: '11:00 AM - 9:30 PM',
      friday: '11:00 AM - 10:00 PM',
      saturday: '11:00 AM - 10:00 PM',
      sunday: '12:00 PM - 9:00 PM'
    },
    features: ['Vegan Options', 'Spice Levels', 'Lunch Buffet'],
    activeJobs: 4,
    employees: 12
  },
  {
    id: 6,
    name: 'Ocean View Seafood',
    cuisine: ['Seafood', 'American'],
    description: 'Fresh seafood with stunning bay views, featuring daily catches and sustainable sourcing.',
    address: '987 Fisherman\'s Wharf, San Francisco, CA 94133',
    phone: '(415) 555-0987',
    rating: 4.4,
    reviewCount: 234,
    priceRange: '$$$',
    deliveryTime: '40-55 min',
    minimumOrder: 35,
    deliveryFee: 4.49,
    verified: true,
    openNow: true,
    image: '🦞',
    specialties: ['Dungeness Crab', 'Cioppino', 'Clam Chowder'],
    openingHours: {
      monday: '11:00 AM - 9:00 PM',
      tuesday: '11:00 AM - 9:00 PM',
      wednesday: '11:00 AM - 9:00 PM',
      thursday: '11:00 AM - 9:00 PM',
      friday: '11:00 AM - 10:00 PM',
      saturday: '11:00 AM - 10:00 PM',
      sunday: '11:00 AM - 9:00 PM'
    },
    features: ['Bay Views', 'Sustainable Seafood', 'Raw Bar'],
    activeJobs: 6,
    employees: 28
  }
]

export default function RestaurantsDirectory() {
  const router = useRouter()
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants)
  const [searchTerm, setSearchTerm] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [openFilter, setOpenFilter] = useState<string>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(new Set())

  const allCuisines = Array.from(new Set(restaurants.flatMap(r => r.cuisine)))
  const priceRanges = ['$', '$$', '$$$', '$$$$']

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         restaurant.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCuisine = cuisineFilter === 'all' || restaurant.cuisine.includes(cuisineFilter)
    const matchesPrice = priceFilter === 'all' || restaurant.priceRange === priceFilter
    const matchesOpen = openFilter === 'all' || 
                       (openFilter === 'open' && restaurant.openNow) ||
                       (openFilter === 'closed' && !restaurant.openNow)
    const matchesVerified = !verifiedOnly || restaurant.verified

    return matchesSearch && matchesCuisine && matchesPrice && matchesOpen && matchesVerified
  })

  const toggleFavorite = (restaurantId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(restaurantId)) {
        newFavorites.delete(restaurantId)
      } else {
        newFavorites.add(restaurantId)
      }
      return newFavorites
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Directory</h1>
              <p className="text-gray-600 mt-2">Discover great restaurants and dining experiences</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {filteredRestaurants.length} of {restaurants.length} restaurants
              </div>
              <button 
                onClick={() => router.push('/auth/register')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Join Platform
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cuisine Filter */}
            <div className="lg:col-span-2">
              <select
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Cuisines</option>
                {allCuisines.map(cuisine => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="lg:col-span-2">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Prices</option>
                {priceRanges.map(price => (
                  <option key={price} value={price}>{price}</option>
                ))}
              </select>
            </div>

            {/* Open Filter */}
            <div className="lg:col-span-2">
              <select
                value={openFilter}
                onChange={(e) => setOpenFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Hours</option>
                <option value="open">Open Now</option>
                <option value="closed">Closed Now</option>
              </select>
            </div>

            {/* Verified Filter */}
            <div className="lg:col-span-2 flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Verified only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                      {restaurant.image}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-xl font-semibold text-gray-900">{restaurant.name}</h3>
                        {restaurant.verified && (
                          <CheckCircleIcon className="w-5 h-5 text-blue-500 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        {restaurant.cuisine.map((cuisine, index) => (
                          <span key={index} className={`text-sm ${index === 0 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                            {index > 0 && ' • '}{cuisine}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(restaurant.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      {favorites.has(restaurant.id) ? (
                        <HeartSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                    </button>
                    <div className={`px-3 py-1 text-sm font-medium rounded-full ${
                      restaurant.openNow
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {restaurant.openNow ? 'Open' : 'Closed'}
                    </div>
                  </div>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`w-4 h-4 ${
                        i < Math.floor(restaurant.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {restaurant.rating} ({restaurant.reviewCount} reviews)
                    </span>
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-900">{restaurant.priceRange}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{restaurant.description}</p>

                {/* Address & Contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{restaurant.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    <span>{restaurant.phone}</span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <span>{restaurant.deliveryTime}</span>
                  </div>
                  <div className="flex items-center">
                    <TruckIcon className="w-4 h-4 mr-1" />
                    <span>${restaurant.deliveryFee} delivery</span>
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                    <span>${restaurant.minimumOrder} min</span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {restaurant.specialties.slice(0, 3).map((specialty, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-6">
                  <span>{restaurant.employees} employees</span>
                  <span>{restaurant.activeJobs} active job postings</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/profile/restaurant/${restaurant.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => router.push(`/jobs?restaurant=${restaurant.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Jobs ({restaurant.activeJobs})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏪</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setCuisineFilter('all')
                setPriceFilter('all')
                setOpenFilter('all')
                setVerifiedOnly(false)
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}