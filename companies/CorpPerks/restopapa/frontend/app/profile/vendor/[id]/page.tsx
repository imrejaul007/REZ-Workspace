'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  StarIcon,
  ShoppingCartIcon,
  TruckIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  HeartIcon,
  ShareIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'

const mockVendorData = {
  id: '1',
  businessName: 'Fresh Farm Supplies',
  contactPersonName: 'Rajesh Kumar',
  description: 'Leading supplier of fresh vegetables, fruits, and premium ingredients to restaurants across Mumbai. We pride ourselves on quality, freshness, and reliable delivery services. Our products are sourced directly from farms and we maintain cold chain facilities to ensure maximum freshness.',
  email: 'info@freshfarmsupplies.com',
  phone: '+91 98765 43210',
  website: 'https://freshfarmsupplies.com',
  establishedYear: 2012,
  categories: ['Fresh Vegetables', 'Fruits', 'Dairy Products', 'Spices & Herbs', 'Frozen Foods'],
  rating: 4.7,
  reviewCount: 234,
  verified: true,
  responseTime: '2 hours',
  fulfillmentRate: 98,
  profileImage: '/placeholder-vendor.jpg',
  coverImage: '/placeholder-cover.jpg',
  gallery: [
    '/placeholder-product1.jpg',
    '/placeholder-product2.jpg',
    '/placeholder-product3.jpg',
    '/placeholder-product4.jpg',
    '/placeholder-product5.jpg',
    '/placeholder-product6.jpg'
  ],
  addresses: [{
    id: '1',
    type: 'warehouse',
    street: '456 Industrial Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400013',
    country: 'India',
    isPrimary: true
  }],
  businessHours: {
    monday: { open: '06:00', close: '18:00', isClosed: false },
    tuesday: { open: '06:00', close: '18:00', isClosed: false },
    wednesday: { open: '06:00', close: '18:00', isClosed: false },
    thursday: { open: '06:00', close: '18:00', isClosed: false },
    friday: { open: '06:00', close: '18:00', isClosed: false },
    saturday: { open: '06:00', close: '16:00', isClosed: false },
    sunday: { open: '08:00', close: '14:00', isClosed: false }
  },
  services: [
    'Same-day delivery',
    'Bulk orders',
    'Custom packaging',
    'Quality guarantee',
    'Cold chain storage',
    '24/7 support',
    'Organic products',
    'Seasonal specials'
  ],
  deliveryAreas: [
    'Mumbai Central',
    'Bandra',
    'Andheri',
    'Powai',
    'Goregaon',
    'Malad',
    'Borivali',
    'Thane'
  ],
  stats: {
    totalProducts: 450,
    monthlyOrders: 1247,
    totalCustomers: 89,
    monthlyRevenue: 325000,
    averageDeliveryTime: '4.5 hours'
  },
  products: [
    {
      id: '1',
      name: 'Fresh Tomatoes',
      category: 'Vegetables',
      price: 45,
      unit: 'kg',
      inStock: true,
      image: '/placeholder-tomato.jpg',
      rating: 4.8,
      reviews: 24
    },
    {
      id: '2',
      name: 'Premium Onions',
      category: 'Vegetables',
      price: 35,
      unit: 'kg',
      inStock: true,
      image: '/placeholder-onion.jpg',
      rating: 4.6,
      reviews: 18
    },
    {
      id: '3',
      name: 'Organic Spinach',
      category: 'Leafy Greens',
      price: 60,
      unit: 'kg',
      inStock: false,
      image: '/placeholder-spinach.jpg',
      rating: 4.9,
      reviews: 31
    }
  ],
  reviews: [
    {
      id: '1',
      customerName: 'Mumbai Palace Restaurant',
      customerType: 'Restaurant',
      rating: 5,
      comment: 'Excellent quality products and very reliable delivery. We have been ordering from them for over 2 years.',
      date: '2024-01-20T10:00:00Z',
      verified: true,
      helpful: 15
    },
    {
      id: '2',
      customerName: 'Spice Garden',
      customerType: 'Restaurant',
      rating: 4,
      comment: 'Good quality vegetables. Sometimes delivery is delayed but overall satisfied with the service.',
      date: '2024-01-18T14:30:00Z',
      verified: true,
      helpful: 8
    }
  ],
  certifications: [
    'FSSAI Licensed',
    'ISO 22000 Certified',
    'Organic Certified',
    'Cold Chain Certified'
  ]
}

export default function VendorProfile() {
  const [vendor, setVendor] = useState(mockVendorData)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFollowing, setIsFollowing] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const params = useParams()
  const router = useRouter()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCurrentStatus = () => {
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'monday' }).toLowerCase()
    const currentTime = now.getHours() * 100 + now.getMinutes()
    
    const todayHours = vendor.businessHours[currentDay as keyof typeof vendor.businessHours]
    if (todayHours?.isClosed) return { status: 'Closed', color: 'text-red-600' }
    
    if (todayHours) {
      const openTime = parseInt(todayHours.open.replace(':', ''))
      const closeTime = parseInt(todayHours.close.replace(':', ''))
      
      if (currentTime >= openTime && currentTime <= closeTime) {
        return { status: 'Open Now', color: 'text-green-600' }
      }
    }
    
    return { status: 'Closed', color: 'text-red-600' }
  }

  const currentStatus = getCurrentStatus()

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-72 bg-gradient-to-r from-green-600 to-blue-600">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${vendor.coverImage})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end">
          <div className="pb-6 flex items-end space-x-6 w-full">
            <div className="relative">
              <div className="w-28 h-28 rounded-lg border-4 border-white bg-white overflow-hidden">
                <Image
                  src={vendor.profileImage}
                  alt={vendor.businessName}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
              {vendor.verified && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                  <CheckBadgeIcon className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-white pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{vendor.businessName}</h1>
                  <p className="text-xl text-green-100 mt-1">{vendor.contactPersonName}</p>
                  
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(vendor.rating)}
                      <span className="ml-1 font-medium">{vendor.rating}</span>
                      <span className="text-gray-200">({vendor.reviewCount} reviews)</span>
                    </div>
                    <span className={`font-medium ${currentStatus.color} bg-white px-2 py-1 rounded text-sm`}>
                      {currentStatus.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2 text-gray-200">
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{vendor.addresses[0].city}, {vendor.addresses[0].state}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span>Est. {vendor.establishedYear}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>{vendor.responseTime} response time</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isFollowing 
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <HeartIconSolid className="w-5 h-5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <HeartIcon className="w-5 h-5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-gray-900 transition-colors">
                    <ShareIcon className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center space-x-2 text-white hover:text-gray-200 bg-black bg-opacity-20 rounded-lg px-3 py-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'products', name: `Products (${vendor.stats.totalProducts})` },
              { id: 'reviews', name: `Reviews (${vendor.reviewCount})` },
              { id: 'gallery', name: 'Gallery' },
              { id: 'contact', name: 'Contact' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {vendor.businessName}</h2>
                <p className="text-gray-600 leading-relaxed">{vendor.description}</p>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{vendor.stats.totalProducts}</div>
                    <div className="text-sm text-gray-500">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{vendor.stats.totalCustomers}</div>
                    <div className="text-sm text-gray-500">Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{vendor.stats.monthlyOrders}</div>
                    <div className="text-sm text-gray-500">Monthly Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{vendor.fulfillmentRate}%</div>
                    <div className="text-sm text-gray-500">Fulfillment Rate</div>
                  </div>
                </div>
              </div>

              {/* Categories & Services */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories & Services</h2>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Product Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.categories.map((category, index) => (
                      <span
                        key={index}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Services Offered</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {vendor.services.map((service, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Delivery Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {vendor.deliveryAreas.map((area, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Certifications & Quality</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vendor.certifications.map((cert, index) => (
                    <div key={index} className="text-center p-4 bg-green-50 rounded-lg">
                      <ShieldCheckIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <span className="text-sm font-medium text-green-800">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Info</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="font-medium text-gray-900">{vendor.responseTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Fulfillment Rate</span>
                    <span className="font-medium text-green-600">{vendor.fulfillmentRate}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg. Delivery</span>
                    <span className="font-medium text-gray-900">{vendor.stats.averageDeliveryTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Revenue</span>
                    <span className="font-medium text-gray-900">{formatCurrency(vendor.stats.monthlyRevenue)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Contact Vendor
                  </button>
                  <button className="w-full mt-2 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    View Catalog
                  </button>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Hours</h2>
                <div className="space-y-2">
                  {Object.entries(vendor.businessHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-gray-900 capitalize">{day}</span>
                      <span className="text-gray-600">
                        {hours.isClosed ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                View All Products
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendor.products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1">
                        {renderStars(product.rating)}
                        <span className="text-sm text-gray-600">({product.reviews})</span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{product.price}/{product.unit}
                      </span>
                    </div>
                    
                    <button 
                      disabled={!product.inStock}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        product.inStock
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
              
              <div className="space-y-6">
                {vendor.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{review.customerName}</h4>
                          {review.verified && (
                            <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                          )}
                          <span className="text-sm text-gray-500">({review.customerType})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">{formatDate(review.date)}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{review.helpful} helpful</span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendor.gallery.map((image, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              >
                <Image
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <BuildingStorefrontIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Business Name</div>
                    <div className="text-gray-600">{vendor.businessName}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Contact Person</div>
                    <div className="text-gray-600">{vendor.contactPersonName}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Address</div>
                    <div className="text-gray-600">
                      {vendor.addresses[0].street}, {vendor.addresses[0].city}
                      <br />
                      {vendor.addresses[0].state} {vendor.addresses[0].zipCode}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Phone</div>
                    <div className="text-gray-600">{vendor.phone}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <div className="text-gray-600">{vendor.email}</div>
                  </div>
                </div>

                {vendor.website && (
                  <div className="flex items-center space-x-3">
                    <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">Website</div>
                      <a 
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Send Message</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Restaurant/Business Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your business name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select inquiry type</option>
                    <option value="bulk-order">Bulk Order</option>
                    <option value="partnership">Partnership</option>
                    <option value="pricing">Pricing Inquiry</option>
                    <option value="product">Product Information</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Write your message..."
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}