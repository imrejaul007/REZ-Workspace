'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  PhoneIcon,
  GlobeAltIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

// Mock restaurant data
const restaurantData = {
  id: '1',
  name: 'Ocean View Diner',
  logo: '🍽️',
  coverImage: '/api/placeholder/800/300',
  verified: true,
  rating: 4.8,
  reviewCount: 342,
  category: 'Fine Dining',
  priceRange: '$$$',
  location: 'Miami Beach, FL',
  address: '123 Ocean Drive, Miami Beach, FL 33139',
  phone: '+1 (305) 555-0123',
  website: 'www.oceanviewdiner.com',
  established: '2015',
  employees: 45,
  
  hours: {
    'Monday': '11:00 AM - 10:00 PM',
    'Tuesday': '11:00 AM - 10:00 PM', 
    'Wednesday': '11:00 AM - 10:00 PM',
    'Thursday': '11:00 AM - 11:00 PM',
    'Friday': '11:00 AM - 12:00 AM',
    'Saturday': '10:00 AM - 12:00 AM',
    'Sunday': '10:00 AM - 10:00 PM'
  },
  
  description: `Ocean View Diner has been serving exceptional Mediterranean and American cuisine since 2015. Located on the beautiful Miami Beach, we offer a unique dining experience with stunning ocean views and fresh, locally-sourced ingredients.

Our team is passionate about creating memorable dining experiences while maintaining the highest standards of service and food quality. We pride ourselves on being an inclusive workplace that values diversity and professional growth.`,

  features: [
    'Ocean View Dining',
    'Fresh Local Ingredients', 
    'Full Bar',
    'Private Dining Rooms',
    'Outdoor Seating',
    'Valet Parking',
    'Live Music Weekends',
    'Catering Services'
  ],

  gallery: [
    '/api/placeholder/300/200',
    '/api/placeholder/300/200', 
    '/api/placeholder/300/200',
    '/api/placeholder/300/200',
    '/api/placeholder/300/200',
    '/api/placeholder/300/200'
  ],

  openPositions: [
    {
      id: 1,
      title: 'Head Chef',
      department: 'Kitchen',
      type: 'Full-time',
      posted: '2 days ago',
      applications: 24
    },
    {
      id: 2,
      title: 'Server',
      department: 'Front of House',
      type: 'Part-time',
      posted: '1 week ago',
      applications: 18
    },
    {
      id: 3,
      title: 'Bartender',
      department: 'Bar',
      type: 'Full-time',
      posted: '3 days ago',
      applications: 31
    }
  ],

  recentReviews: [
    {
      id: 1,
      employeeName: 'Sarah Johnson',
      position: 'Server',
      rating: 5,
      date: '2 weeks ago',
      comment: 'Amazing work environment with supportive management. Great team culture and opportunities for growth.',
      verified: true
    },
    {
      id: 2,
      employeeName: 'Mike Chen',
      position: 'Line Cook',
      rating: 4,
      date: '1 month ago',
      comment: 'Professional kitchen with high standards. Learned a lot working here. Management is fair and supportive.',
      verified: true
    }
  ]
}

export default function RestaurantProfile({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'jobs', name: 'Open Positions' },
    { id: 'reviews', name: 'Employee Reviews' },
    { id: 'gallery', name: 'Gallery' }
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

  const getCurrentStatus = () => {
    const now = new Date()
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' })
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    const todayHours = restaurantData.hours[currentDay as keyof typeof restaurantData.hours]
    return { currentDay, currentTime, todayHours }
  }

  const { currentDay, currentTime, todayHours } = getCurrentStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <ShareIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="absolute bottom-4 right-4">
          <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 hover:bg-opacity-30 transition-colors">
            <CameraIcon className="w-4 h-4" />
            View Photos
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        {/* Restaurant Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex-shrink-0 bg-white rounded-xl p-4 shadow-sm">
              <div className="text-6xl">{restaurantData.logo}</div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{restaurantData.name}</h1>
                {restaurantData.verified && (
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(Math.floor(restaurantData.rating))}
                  <span className="font-semibold text-gray-900 ml-1">
                    {restaurantData.rating}
                  </span>
                  <span className="text-gray-600">
                    ({restaurantData.reviewCount} reviews)
                  </span>
                </div>
                
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {restaurantData.category}
                </span>
                
                <span className="text-gray-600 font-medium">{restaurantData.priceRange}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{restaurantData.location}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{restaurantData.phone}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <GlobeAltIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{restaurantData.website}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <UserGroupIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{restaurantData.employees} employees</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  Contact Restaurant
                </button>
                
                <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Follow Restaurant
                </button>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                  <ClockIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Open Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
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
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About {restaurantData.name}</h3>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {restaurantData.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Features & Amenities</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {restaurantData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Hours of Operation</h4>
                    <div className="space-y-2">
                      {Object.entries(restaurantData.hours).map(([day, hours]) => (
                        <div key={day} className={`flex justify-between text-sm ${
                          day === currentDay ? 'font-semibold text-gray-900' : 'text-gray-600'
                        }`}>
                          <span>{day}</span>
                          <span>{hours}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm">
                        <ClockIcon className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 font-medium">Open now</span>
                        <span className="text-gray-500">• Closes at 10:00 PM</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Established</span>
                        <span className="font-medium text-gray-900">{restaurantData.established}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Team Size</span>
                        <span className="font-medium text-gray-900">{restaurantData.employees} employees</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Rating</span>
                        <span className="font-medium text-gray-900">{restaurantData.rating}/5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Open Positions ({restaurantData.openPositions.length})</h3>
                </div>
                
                {restaurantData.openPositions.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{job.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>{job.department}</span>
                          <span>•</span>
                          <span>{job.type}</span>
                          <span>•</span>
                          <span>Posted {job.posted}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <UserGroupIcon className="w-4 h-4" />
                          <span>{job.applications} applicants</span>
                        </div>
                      </div>
                      
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Employee Reviews</h3>
                
                {restaurantData.recentReviews.map((review) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{review.employeeName}</span>
                          {review.verified && (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{review.position}</span>
                          <span>•</span>
                          <span>{review.date}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Gallery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurantData.gallery.map((image, index) => (
                    <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                        <CameraIcon className="w-8 h-8 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}