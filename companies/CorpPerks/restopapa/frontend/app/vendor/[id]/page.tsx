'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  StarIcon,
  MapPinIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  TruckIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

// Mock vendor data
const vendorData = {
  id: '1',
  name: 'Fresh Farm Supplies',
  logo: '🚜',
  banner: '/api/placeholder/800/300',
  description: 'Family-owned farm specializing in organic, locally-grown produce. Serving restaurants across Florida with the freshest ingredients since 1987.',
  rating: 4.8,
  reviewCount: 234,
  verified: true,
  location: 'Miami, Florida',
  contact: {
    phone: '+1 (305) 555-0123',
    email: 'info@freshfarmsupplies.com',
    address: '123 Farm Road, Miami, FL 33101'
  },
  stats: {
    totalProducts: 156,
    ordersCompleted: 2847,
    avgDeliveryTime: '24 hours',
    responseTime: '< 2 hours'
  },
  certifications: [
    'USDA Organic Certified',
    'GAP Certified',
    'Local Farm Fresh',
    'Sustainable Agriculture'
  ],
  specialties: ['Organic Produce', 'Seasonal Vegetables', 'Local Sourcing', 'Bulk Orders']
}

const vendorProducts = [
  {
    id: '1',
    name: 'Premium Organic Tomatoes',
    image: '🍅',
    price: 12.99,
    originalPrice: 15.99,
    unit: 'per 5lb box',
    rating: 4.8,
    reviewCount: 45,
    inStock: true,
    category: 'Produce'
  },
  {
    id: '2',
    name: 'Fresh Organic Basil',
    image: '🌿',
    price: 6.99,
    originalPrice: 8.99,
    unit: 'per bunch',
    rating: 4.9,
    reviewCount: 32,
    inStock: true,
    category: 'Herbs'
  },
  {
    id: '3',
    name: 'Organic Bell Peppers',
    image: '🫑',
    price: 8.99,
    originalPrice: 10.99,
    unit: 'per 3lb bag',
    rating: 4.7,
    reviewCount: 28,
    inStock: true,
    category: 'Produce'
  },
  {
    id: '4',
    name: 'Organic Lettuce Mix',
    image: '🥬',
    price: 5.99,
    originalPrice: 7.49,
    unit: 'per 2lb bag',
    rating: 4.6,
    reviewCount: 19,
    inStock: false,
    category: 'Produce'
  }
]

export default function VendorProfile({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<string[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])

  const addToCart = (productId: string) => {
    setCart(prev => [...prev, productId])
    alert('Product added to cart!')
  }

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const categories = ['all', 'Produce', 'Herbs', 'Specialty']
  const filteredProducts = selectedCategory === 'all' 
    ? vendorProducts 
    : vendorProducts.filter(product => product.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="text-sm text-gray-500">
              <span>Marketplace</span>
              <span className="mx-2">›</span>
              <span>Vendors</span>
              <span className="mx-2">›</span>
              <span className="text-gray-900">{vendorData.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Vendor Header */}
        <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
            <div className="text-6xl">{vendorData.logo}</div>
          </div>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{vendorData.name}</h1>
                  {vendorData.verified && (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <StarSolidIcon className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold">{vendorData.rating}</span>
                    <span className="text-gray-500">({vendorData.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{vendorData.location}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{vendorData.description}</p>
                <div className="flex flex-wrap gap-2">
                  {vendorData.specialties.map((specialty, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 ml-6">
                <button 
                  onClick={() => alert('Message sent to vendor!')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  Message
                </button>
                <button 
                  onClick={() => router.push('/cart')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <ShoppingCartIcon className="w-4 h-4" />
                  View Cart ({cart.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Products</span>
                  <span className="font-semibold">{vendorData.stats.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Orders</span>
                  <span className="font-semibold">{vendorData.stats.ordersCompleted.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Delivery</span>
                  <span className="font-semibold">{vendorData.stats.avgDeliveryTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-semibold">{vendorData.stats.responseTime}</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category === 'all' ? 'All Products' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
              <div className="space-y-2">
                {vendorData.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-700">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''}
                </h2>
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-4xl">{product.image}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-xs text-gray-500">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
                      )}
                      <span className="text-xs text-gray-600">{product.unit}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/marketplace/product/${product.id}`)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => product.inStock ? addToCart(product.id) : alert('Out of stock')}
                        disabled={!product.inStock}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm flex items-center justify-center gap-1"
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}