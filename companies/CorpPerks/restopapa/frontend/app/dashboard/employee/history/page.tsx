'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BriefcaseIcon,
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UsersIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

interface WorkExperience {
  id: number
  position: string
  restaurant: {
    name: string
    logo: string
    location: string
    type: string
  }
  startDate: string
  endDate?: string
  current: boolean
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary'
  salary?: string
  description: string
  achievements: string[]
  skills: string[]
  supervisor?: {
    name: string
    contact: string
  }
  reasonForLeaving?: string
  wouldRehire: boolean
  rating: number
  verified: boolean
}

interface Reference {
  id: number
  name: string
  position: string
  company: string
  phone: string
  email: string
  relationship: string
  yearsKnown: number
  canContact: boolean
  verified: boolean
}

const mockExperience: WorkExperience[] = [
  {
    id: 1,
    position: 'Sous Chef',
    restaurant: {
      name: 'Ocean View Restaurant',
      logo: '🌊',
      location: 'Miami Beach, FL',
      type: 'Fine Dining'
    },
    startDate: '2022-03-01',
    current: true,
    employmentType: 'Full-time',
    salary: '$55,000',
    description: 'Leading kitchen operations for a high-volume fine dining restaurant serving 300+ covers nightly. Responsible for menu development, staff training, inventory management, and maintaining food quality standards.',
    achievements: [
      'Reduced food costs by 15% through better inventory management',
      'Trained and mentored 12 junior kitchen staff',
      'Implemented new prep procedures that improved efficiency by 25%',
      'Maintained 95+ health inspection scores consistently'
    ],
    skills: ['Team Leadership', 'Menu Development', 'Cost Control', 'Training', 'Italian Cuisine'],
    supervisor: {
      name: 'Chef Michael Rodriguez',
      contact: '(305) 555-0123'
    },
    wouldRehire: true,
    rating: 5,
    verified: true
  },
  {
    id: 2,
    position: 'Line Cook',
    restaurant: {
      name: 'Bella Italia Ristorante',
      logo: '🍝',
      location: 'Miami, FL',
      type: 'Casual Dining'
    },
    startDate: '2020-01-15',
    endDate: '2022-02-28',
    current: false,
    employmentType: 'Full-time',
    salary: '$16.50/hour',
    description: 'Specialized in pasta and appetizer stations in a busy Italian restaurant. Maintained high standards during peak service periods and contributed to daily prep work.',
    achievements: [
      'Perfect attendance for 18 months',
      'Promoted from prep cook to line cook within 6 months',
      'Received Employee of the Month award 3 times',
      'Cross-trained on all kitchen stations'
    ],
    skills: ['Italian Cuisine', 'Pasta Making', 'Time Management', 'Food Safety', 'Knife Skills'],
    supervisor: {
      name: 'Chef Antonio Rossi',
      contact: '(305) 555-0456'
    },
    reasonForLeaving: 'Career advancement opportunity',
    wouldRehire: true,
    rating: 4,
    verified: true
  },
  {
    id: 3,
    position: 'Prep Cook',
    restaurant: {
      name: 'Downtown Bistro',
      logo: '🥗',
      location: 'Miami, FL',
      type: 'Casual Dining'
    },
    startDate: '2019-06-01',
    endDate: '2019-12-30',
    current: false,
    employmentType: 'Part-time',
    salary: '$14.00/hour',
    description: 'Responsible for daily food preparation, vegetable cutting, sauce preparation, and maintaining cleanliness standards in the prep kitchen.',
    achievements: [
      'Consistently met daily prep targets',
      'Learned basic knife skills and food safety protocols',
      'Assisted with inventory management'
    ],
    skills: ['Knife Skills', 'Food Prep', 'Sanitation', 'Time Management'],
    supervisor: {
      name: 'Chef Sarah Johnson',
      contact: '(305) 555-0789'
    },
    reasonForLeaving: 'Found full-time opportunity',
    wouldRehire: true,
    rating: 3,
    verified: false
  }
]

const mockReferences: Reference[] = [
  {
    id: 1,
    name: 'Chef Michael Rodriguez',
    position: 'Executive Chef',
    company: 'Ocean View Restaurant',
    phone: '(305) 555-0123',
    email: 'mrodriguez@oceanview.com',
    relationship: 'Direct Supervisor',
    yearsKnown: 2,
    canContact: true,
    verified: true
  },
  {
    id: 2,
    name: 'Chef Antonio Rossi',
    position: 'Head Chef',
    company: 'Bella Italia Ristorante',
    phone: '(305) 555-0456',
    email: 'arossi@bellaitalia.com',
    relationship: 'Former Supervisor',
    yearsKnown: 2,
    canContact: true,
    verified: true
  },
  {
    id: 3,
    name: 'Maria Gonzalez',
    position: 'Restaurant Manager',
    company: 'Ocean View Restaurant',
    phone: '(305) 555-0321',
    email: 'mgonzalez@oceanview.com',
    relationship: 'Colleague',
    yearsKnown: 2,
    canContact: true,
    verified: false
  }
]

export default function EmployeeWorkHistory() {
  const router = useRouter()
  const [experiences, setExperiences] = useState<WorkExperience[]>(mockExperience)
  const [references, setReferences] = useState<Reference[]>(mockReferences)
  const [activeTab, setActiveTab] = useState('experience')
  const [selectedExperience, setSelectedExperience] = useState<WorkExperience | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const getEmploymentTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-green-100 text-green-800'
      case 'Part-time': return 'bg-yellow-100 text-yellow-800'
      case 'Contract': return 'bg-blue-100 text-blue-800'
      case 'Temporary': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ))
  }

  const calculateTotalExperience = () => {
    let totalMonths = 0
    experiences.forEach(exp => {
      const start = new Date(exp.startDate)
      const end = exp.current ? new Date() : new Date(exp.endDate!)
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      totalMonths += months
    })
    
    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    return { years, months }
  }

  const totalExp = calculateTotalExperience()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work History</h1>
              <p className="text-gray-600 mt-1">Your complete employment history and references</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Experience</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalExp.years}y {totalExp.months}m
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Positions Held</p>
                <p className="text-2xl font-bold text-gray-900">{experiences.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <StarIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(experiences.reduce((sum, exp) => sum + exp.rating, 0) / experiences.length).toFixed(1)}/5
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">References</p>
                <p className="text-2xl font-bold text-gray-900">{references.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'experience', label: 'Work Experience', icon: BriefcaseIcon },
                { id: 'references', label: 'References', icon: UsersIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Experience
              </button>
            </div>

            <div className="space-y-6">
              {experiences.map((experience, index) => (
                <div key={experience.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                          {experience.restaurant.logo}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{experience.position}</h3>
                            {experience.current && (
                              <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Current
                              </span>
                            )}
                            {experience.verified && (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          
                          <p className="text-blue-600 font-medium">{experience.restaurant.name}</p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {experience.restaurant.location}
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {new Date(experience.startDate).toLocaleDateString()} - {
                                experience.current ? 'Present' : new Date(experience.endDate!).toLocaleDateString()
                              }
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(experience.employmentType)}`}>
                              {experience.employmentType}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <span className="font-medium">Rating:</span>
                              <div className="flex items-center ml-2">
                                {getRatingStars(experience.rating)}
                              </div>
                            </div>
                            {experience.salary && (
                              <div className="flex items-center">
                                <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                                {experience.salary}
                              </div>
                            )}
                          </div>

                          <p className="text-gray-700 mt-3 line-clamp-2">{experience.description}</p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {experience.skills.slice(0, 4).map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                            {experience.skills.length > 4 && (
                              <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-full">
                                +{experience.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedExperience(experience)
                            setShowDetails(true)
                          }}
                          className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          Details
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References Tab */}
        {activeTab === 'references' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Professional References</h2>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Reference
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {references.map((reference) => (
                <div key={reference.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{reference.name}</h3>
                        <p className="text-blue-600 text-sm">{reference.position}</p>
                      </div>
                    </div>
                    {reference.verified && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Company:</span> {reference.company}</p>
                    <p><span className="font-medium">Relationship:</span> {reference.relationship}</p>
                    <p><span className="font-medium">Years Known:</span> {reference.yearsKnown}</p>
                    <p><span className="font-medium">Phone:</span> {reference.phone}</p>
                    <p><span className="font-medium">Email:</span> {reference.email}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      {reference.canContact ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {reference.canContact ? 'Can contact' : 'Do not contact'}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-gray-400 hover:text-gray-600">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Experience Details Modal */}
      {showDetails && selectedExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {selectedExperience.restaurant.logo}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedExperience.position}</h2>
                    <p className="text-blue-600 font-medium">{selectedExperience.restaurant.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Job Description</h3>
                <p className="text-gray-700">{selectedExperience.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Key Achievements</h3>
                <ul className="space-y-2">
                  {selectedExperience.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start">
                      <TrophyIcon className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                      <span className="text-gray-700">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Skills Used</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedExperience.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedExperience.supervisor && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Supervisor</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{selectedExperience.supervisor.name}</p>
                    <p className="text-gray-600">{selectedExperience.supervisor.contact}</p>
                  </div>
                </div>
              )}

              {selectedExperience.reasonForLeaving && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Reason for Leaving</h3>
                  <p className="text-gray-700">{selectedExperience.reasonForLeaving}</p>
                </div>
              )}

              <div className="pt-6 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}