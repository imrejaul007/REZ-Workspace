'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  StarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

// Mock employee data
const employeeData = {
  id: '1',
  name: 'Maria Rodriguez',
  avatar: '👩‍🍳',
  title: 'Senior Chef',
  location: 'Miami Beach, FL',
  verified: true,
  rating: 4.9,
  reviewCount: 127,
  experience: '8 years',
  availability: 'Available',
  hourlyRate: '$25-30/hr',
  joinDate: 'March 2020',
  bio: `Passionate chef with 8 years of experience in fine dining and fast-casual restaurants. Specializing in Mediterranean and American cuisine with expertise in kitchen management and team leadership.

I'm dedicated to creating exceptional dining experiences while maintaining high food safety standards. Looking for opportunities to grow and contribute to a dynamic restaurant team.`,
  
  skills: [
    { name: 'Kitchen Management', level: 5 },
    { name: 'Menu Planning', level: 4 },
    { name: 'Food Safety', level: 5 },
    { name: 'Team Leadership', level: 4 },
    { name: 'Mediterranean Cuisine', level: 5 },
    { name: 'Inventory Management', level: 4 }
  ],

  experience_history: [
    {
      title: 'Head Chef',
      restaurant: 'Sunset Bistro',
      duration: '2021 - Present',
      description: 'Leading kitchen operations for upscale Mediterranean restaurant serving 200+ covers daily.',
      verified: true
    },
    {
      title: 'Sous Chef',
      restaurant: 'Ocean View Diner',
      duration: '2019 - 2021',
      description: 'Assisted in menu development and supervised kitchen staff of 12 members.',
      verified: true
    },
    {
      title: 'Line Cook',
      restaurant: 'Downtown Grill',
      duration: '2016 - 2019',
      description: 'Specialized in grill station and gained experience in high-volume cooking.',
      verified: false
    }
  ],

  certifications: [
    { name: 'ServSafe Food Handler', date: '2023', verified: true },
    { name: 'Culinary Arts Certificate', date: '2016', verified: true },
    { name: 'Kitchen Management Course', date: '2020', verified: true }
  ],

  recent_reviews: [
    {
      id: 1,
      restaurant: 'Sunset Bistro',
      rating: 5,
      comment: 'Maria is an exceptional chef with great leadership skills. Her Mediterranean dishes are outstanding!',
      reviewer: 'Restaurant Manager',
      date: '2 weeks ago'
    },
    {
      id: 2,
      restaurant: 'Ocean View Diner',
      rating: 5,
      comment: 'Reliable, professional, and creative. Maria consistently delivered high-quality dishes.',
      reviewer: 'Head Chef',
      date: '1 month ago'
    }
  ]
}

export default function EmployeeProfile({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'experience', name: 'Experience' },
    { id: 'reviews', name: 'Reviews' },
    { id: 'certifications', name: 'Certifications' }
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
              <span>Back to Search</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <ShareIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Header */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="text-6xl mb-2">{employeeData.avatar}</div>
                  <div className="text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      employeeData.availability === 'Available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employeeData.availability}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{employeeData.name}</h1>
                    {employeeData.verified && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  
                  <h2 className="text-xl text-gray-600 mb-4">{employeeData.title}</h2>
                  
                  <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{employeeData.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <BriefcaseIcon className="w-4 h-4" />
                      <span>{employeeData.experience} experience</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Joined {employeeData.joinDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(Math.floor(employeeData.rating))}
                      <span className="font-semibold text-gray-900 ml-1">
                        {employeeData.rating}
                      </span>
                      <span className="text-gray-600">
                        ({employeeData.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6 max-w-3xl">
                    {employeeData.bio}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      Contact Employee
                    </button>
                    
                    <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <UserPlusIcon className="w-4 h-4" />
                      Add to Favorites
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-semibold text-gray-900">{employeeData.hourlyRate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="lg:col-span-3">
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
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Expertise</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {employeeData.skills.map((skill, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-800">{skill.name}</span>
                            <div className="flex items-center gap-1">
                              {renderStars(skill.level)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Experience Tab */}
                {activeTab === 'experience' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Experience</h3>
                    {employeeData.experience_history.map((exp, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                              {exp.verified && (
                                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-gray-600 font-medium mb-1">{exp.restaurant}</p>
                            <p className="text-sm text-gray-500 mb-2">{exp.duration}</p>
                            <p className="text-gray-600">{exp.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
                    {employeeData.recent_reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{review.restaurant}</span>
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">{review.reviewer} • {review.date}</p>
                          </div>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications Tab */}
                {activeTab === 'certifications' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employeeData.certifications.map((cert, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">{cert.name}</h4>
                                {cert.verified && (
                                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500">Issued {cert.date}</p>
                            </div>
                            <AcademicCapIcon className="w-6 h-6 text-blue-500" />
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
      </div>
    </div>
  )
}