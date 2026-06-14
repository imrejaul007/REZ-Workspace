'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  BuildingStorefrontIcon,
  UserIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

// Mock search results data
const searchResults = {
  jobs: [
    {
      id: 1,
      title: 'Head Chef',
      restaurant: 'Ocean View Diner',
      location: 'Miami Beach, FL',
      salary: '$55,000 - $65,000',
      type: 'Full-time',
      posted: '2 days ago',
      logo: '🍽️',
      verified: true,
      rating: 4.8,
      applications: 24
    },
    {
      id: 2,
      title: 'Server',
      restaurant: 'Downtown Grill',
      location: 'Miami, FL',
      salary: '$30,000 - $35,000',
      type: 'Part-time',
      posted: '3 days ago',
      logo: '🔥',
      verified: true,
      rating: 4.5,
      applications: 18
    },
    {
      id: 3,
      title: 'Bartender',
      restaurant: 'Sunset Lounge',
      location: 'South Beach, FL',
      salary: '$35,000 - $45,000',
      type: 'Full-time',
      posted: '1 week ago',
      logo: '🍹',
      verified: false,
      rating: 4.2,
      applications: 31
    }
  ],
  
  employees: [
    {
      id: 1,
      name: 'Maria Rodriguez',
      title: 'Senior Chef',
      location: 'Miami Beach, FL',
      experience: '8 years',
      rating: 4.9,
      reviewCount: 127,
      avatar: '👩‍🍳',
      verified: true,
      availability: 'Available',
      skills: ['Kitchen Management', 'Mediterranean Cuisine', 'Team Leadership']
    },
    {
      id: 2,
      name: 'John Smith',
      title: 'Restaurant Manager',
      location: 'Miami, FL',
      experience: '10 years',
      rating: 4.7,
      reviewCount: 89,
      avatar: '👨‍💼',
      verified: true,
      availability: 'Seeking Opportunities',
      skills: ['Operations Management', 'Staff Training', 'Customer Service']
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      title: 'Pastry Chef',
      location: 'Coral Gables, FL',
      experience: '6 years',
      rating: 4.8,
      reviewCount: 156,
      avatar: '👩‍🍳',
      verified: true,
      availability: 'Available',
      skills: ['Baking', 'Dessert Design', 'Menu Development']
    }
  ],
  
  restaurants: [
    {
      id: 1,
      name: 'Ocean View Diner',
      category: 'Fine Dining',
      location: 'Miami Beach, FL',
      rating: 4.8,
      reviewCount: 342,
      logo: '🍽️',
      verified: true,
      employees: 45,
      openPositions: 3,
      description: 'Upscale Mediterranean restaurant with ocean views'
    },
    {
      id: 2,
      name: 'Downtown Grill',
      category: 'American Cuisine',
      location: 'Miami, FL',
      rating: 4.5,
      reviewCount: 198,
      logo: '🔥',
      verified: true,
      employees: 28,
      openPositions: 2,
      description: 'Classic American grill in the heart of downtown'
    }
  ],
  
  products: [
    {
      id: 1,
      name: 'Premium Organic Tomatoes',
      vendor: 'Fresh Farm Supplies',
      price: 12.99,
      unit: 'per 5lb box',
      rating: 4.8,
      reviewCount: 156,
      image: '🍅',
      verified: true,
      features: ['USDA Organic', 'Vine-Ripened', 'Next Day Delivery']
    },
    {
      id: 2,
      name: 'Professional Chef Knives Set',
      vendor: 'Kitchen Pro Equipment',
      price: 299.99,
      unit: 'per set',
      rating: 4.9,
      reviewCount: 89,
      image: '🔪',
      verified: true,
      features: ['German Steel', '10-Piece Set', 'Lifetime Warranty']
    }
  ]
}

export default function SearchResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [activeTab, setActiveTab] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    location: '',
    salary: '',
    type: '',
    experience: '',
    rating: ''
  })

  const tabs = [
    { id: 'all', name: 'All', count: 9 },
    { id: 'jobs', name: 'Jobs', count: 3 },
    { id: 'employees', name: 'Employees', count: 3 },
    { id: 'restaurants', name: 'Restaurants', count: 2 },
    { id: 'products', name: 'Products', count: 2 }
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      index < rating ? (
        <StarSolidIcon key={index} className="w-4 h-4 text-yellow-400" />
      ) : (
        <StarIcon key={index} className="w-4 h-4 text-gray-300" />
      )
    ))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Update URL with search query
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.push(`/search?${params.toString()}`)
  }

  const JobCard = ({ job }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{job.logo}</div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{job.restaurant}</span>
              {job.verified && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {renderStars(Math.floor(job.rating))}
              <span className="text-sm text-gray-500 ml-1">({job.rating})</span>
            </div>
          </div>
        </div>
        <span className="text-lg font-semibold text-gray-900">{job.salary}</span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <BriefcaseIcon className="w-4 h-4" />
          <span>{job.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-4 h-4" />
          <span>Posted {job.posted}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{job.applications} applicants</span>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          View Job
        </button>
      </div>
    </div>
  )

  const EmployeeCard = ({ employee }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{employee.avatar}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-lg">{employee.name}</h3>
            {employee.verified && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-gray-600 mb-1">{employee.title}</p>
          <div className="flex items-center gap-1 mb-2">
            {renderStars(Math.floor(employee.rating))}
            <span className="text-sm text-gray-500 ml-1">
              {employee.rating} ({employee.reviewCount} reviews)
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          employee.availability === 'Available' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {employee.availability}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          <span>{employee.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-4 h-4" />
          <span>{employee.experience} experience</span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {employee.skills.map((skill: string, index: number) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>
      
      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
        View Profile
      </button>
    </div>
  )

  const RestaurantCard = ({ restaurant }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{restaurant.logo}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-lg">{restaurant.name}</h3>
            {restaurant.verified && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
          </div>
          <p className="text-gray-600 mb-1">{restaurant.category}</p>
          <div className="flex items-center gap-1 mb-2">
            {renderStars(Math.floor(restaurant.rating))}
            <span className="text-sm text-gray-500 ml-1">
              {restaurant.rating} ({restaurant.reviewCount} reviews)
            </span>
          </div>
          <p className="text-sm text-gray-600">{restaurant.description}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          <span>{restaurant.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <UserIcon className="w-4 h-4" />
          <span>{restaurant.employees} employees</span>
        </div>
        <div className="flex items-center gap-1">
          <BriefcaseIcon className="w-4 h-4" />
          <span>{restaurant.openPositions} open positions</span>
        </div>
      </div>
      
      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
        View Restaurant
      </button>
    </div>
  )

  const ProductCard = ({ product }: any) => (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{product.image}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{product.name}</h3>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-600">{product.vendor}</span>
            {product.verified && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {renderStars(Math.floor(product.rating))}
            <span className="text-sm text-gray-500 ml-1">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-gray-900">${product.price}</span>
          <p className="text-sm text-gray-500">{product.unit}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {product.features.map((feature: string, index: number) => (
            <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
              {feature}
            </span>
          ))}
        </div>
      </div>
      
      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
        View Product
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search jobs, employees, restaurants, products..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
              <span>Filters</span>
            </button>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Results Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results {query && `for "${query}"`}
          </h1>
          <p className="text-gray-600">Found 9 results</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {(activeTab === 'all' || activeTab === 'jobs') && (
            <>
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BriefcaseIcon className="w-5 h-5" />
                  Jobs
                </h2>
              )}
              {searchResults.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </>
          )}

          {(activeTab === 'all' || activeTab === 'employees') && (
            <>
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mt-8">
                  <UserIcon className="w-5 h-5" />
                  Employees
                </h2>
              )}
              {searchResults.employees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </>
          )}

          {(activeTab === 'all' || activeTab === 'restaurants') && (
            <>
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mt-8">
                  <BuildingStorefrontIcon className="w-5 h-5" />
                  Restaurants
                </h2>
              )}
              {searchResults.restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </>
          )}

          {(activeTab === 'all' || activeTab === 'products') && (
            <>
              {activeTab === 'all' && (
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mt-8">
                  <ShoppingCartIcon className="w-5 h-5" />
                  Products
                </h2>
              )}
              {searchResults.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </>
          )}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            Load More Results
          </button>
        </div>
      </div>
    </div>
  )
}