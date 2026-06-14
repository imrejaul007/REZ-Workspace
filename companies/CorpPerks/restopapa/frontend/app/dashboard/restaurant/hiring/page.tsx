'use client'

import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  UserIcon,
  CheckBadgeIcon,
  XMarkIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface Employee {
  id: string
  name: string
  phone: string
  email: string
  location: string
  distance: number
  experience: number
  skills: string[]
  rating: number
  totalReviews: number
  availability: 'Available' | 'Employed' | 'Looking'
  expectedSalary: number
  profilePhoto: string
  lastActive: string
  verified: {
    aadhar: boolean
    pan: boolean
    phone: boolean
    email: boolean
    address: boolean
  }
  background: {
    criminalCheck: 'Verified' | 'Pending' | 'Failed'
    employmentHistory: number
    references: number
  }
  workHistory: Array<{
    restaurant: string
    position: string
    duration: string
    rating: number
  }>
  documents: {
    aadhar: string
    pan: string
    bankStatement: string
    certificates: string[]
  }
}

interface JobPost {
  id: string
  title: string
  description: string
  requirements: string[]
  salary: { min: number; max: number }
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract'
  urgent: boolean
  postedDate: string
  applicants: number
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@email.com',
    location: 'Connaught Place, Delhi',
    distance: 2.5,
    experience: 5,
    skills: ['Chinese Cuisine', 'Fast Food', 'Kitchen Management'],
    rating: 4.8,
    totalReviews: 24,
    availability: 'Available',
    expectedSalary: 25000,
    profilePhoto: 'https://via.placeholder.com/100',
    lastActive: '2 hours ago',
    verified: { aadhar: true, pan: true, phone: true, email: true, address: true },
    background: { criminalCheck: 'Verified', employmentHistory: 3, references: 4 },
    workHistory: [
      { restaurant: 'Hotel Taj', position: 'Senior Chef', duration: '2 years', rating: 4.9 },
      { restaurant: 'Cafe Coffee Day', position: 'Kitchen Staff', duration: '1 year', rating: 4.5 }
    ],
    documents: {
      aadhar: 'verified',
      pan: 'verified', 
      bankStatement: 'verified',
      certificates: ['Food Safety', 'Culinary Arts Diploma']
    }
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '+91 87654 32109',
    email: 'priya.sharma@email.com',
    location: 'Karol Bagh, Delhi',
    distance: 4.2,
    experience: 3,
    skills: ['Customer Service', 'Cashier', 'Food Serving'],
    rating: 4.6,
    totalReviews: 18,
    availability: 'Looking',
    expectedSalary: 18000,
    profilePhoto: 'https://via.placeholder.com/100',
    lastActive: '1 day ago',
    verified: { aadhar: true, pan: false, phone: true, email: true, address: true },
    background: { criminalCheck: 'Pending', employmentHistory: 2, references: 3 },
    workHistory: [
      { restaurant: 'McDonalds', position: 'Service Staff', duration: '1.5 years', rating: 4.7 },
      { restaurant: 'Pizza Hut', position: 'Cashier', duration: '8 months', rating: 4.4 }
    ],
    documents: {
      aadhar: 'verified',
      pan: 'pending',
      bankStatement: 'verified',
      certificates: ['Customer Service Training']
    }
  }
]

const mockJobPosts: JobPost[] = [
  {
    id: '1',
    title: 'Senior Chef',
    description: 'Looking for experienced chef for fine dining restaurant',
    requirements: ['5+ years experience', 'Chinese cuisine expertise', 'Leadership skills'],
    salary: { min: 25000, max: 35000 },
    location: 'CP, Delhi',
    type: 'Full-time',
    urgent: true,
    postedDate: '2024-01-15',
    applicants: 12
  }
]

export default function HiringPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [activeTab, setActiveTab] = useState('search')
  const [filters, setFilters] = useState({
    location: '',
    experience: '',
    salary: '',
    skills: '',
    availability: ''
  })

  const filteredEmployees = mockEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
    employee.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderVerificationBadge = (verified: Employee['verified']) => {
    const verifiedCount = Object.values(verified).filter(Boolean).length
    const total = Object.keys(verified).length
    const percentage = (verifiedCount / total) * 100

    return (
      <div className="flex items-center space-x-1">
        <CheckBadgeIcon className={`h-4 w-4 ${percentage === 100 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500'}`} />
        <span className={`text-sm ${percentage === 100 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {verifiedCount}/{total} Verified
        </span>
      </div>
    )
  }

  const renderEmployeeCard = (employee: Employee) => (
    <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <img
            src={employee.profilePhoto}
            alt={employee.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
              <div className="flex items-center space-x-2">
                {renderVerificationBadge(employee.verified)}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  employee.availability === 'Available' ? 'bg-green-100 text-green-800' :
                  employee.availability === 'Looking' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {employee.availability}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {employee.location} ({employee.distance}km)
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {employee.experience} years exp
              </div>
              <div className="flex items-center">
                <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                ₹{employee.expectedSalary.toLocaleString()}/month
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  i < Math.floor(employee.rating) ? (
                    <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
                  ) : (
                    <StarIcon key={i} className="h-4 w-4 text-gray-300" />
                  )
                ))}
                <span className="ml-1 text-sm text-gray-600">
                  {employee.rating} ({employee.totalReviews} reviews)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {employee.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {skill}
                </span>
              ))}
              {employee.skills.length > 3 && (
                <span className="text-xs text-gray-500">+{employee.skills.length - 3} more</span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <DocumentCheckIcon className="h-4 w-4" />
                <span>Background: {employee.background.criminalCheck}</span>
                <span>•</span>
                <span>Last active: {employee.lastActive}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedEmployee(employee)}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </button>
                <button className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-md">
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4 mr-1" />
                  Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEmployeeDetails = () => {
    if (!selectedEmployee) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Employee Details</h2>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={selectedEmployee.profilePhoto}
                      alt={selectedEmployee.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold">{selectedEmployee.name}</h3>
                      <p className="text-gray-600">{selectedEmployee.email}</p>
                      <p className="text-gray-600">{selectedEmployee.phone}</p>
                      <p className="text-gray-600">{selectedEmployee.location}</p>
                      
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          i < Math.floor(selectedEmployee.rating) ? (
                            <StarIconSolid key={i} className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <StarIcon key={i} className="h-5 w-5 text-gray-300" />
                          )
                        ))}
                        <span className="ml-2 text-gray-600">
                          {selectedEmployee.rating} ({selectedEmployee.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Verification Status</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedEmployee.verified).map(([key, verified]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="capitalize">{key}</span>
                        {verified ? (
                          <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Background Check</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Criminal Background</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedEmployee.background.criminalCheck === 'Verified' ? 'bg-green-100 text-green-800' :
                        selectedEmployee.background.criminalCheck === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedEmployee.background.criminalCheck}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Employment History</span>
                      <span>{selectedEmployee.background.employmentHistory} previous jobs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>References</span>
                      <span>{selectedEmployee.background.references} references</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Work History</h4>
                  <div className="space-y-3">
                    {selectedEmployee.workHistory.map((job, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">{job.position}</h5>
                            <p className="text-gray-600">{job.restaurant}</p>
                            <p className="text-sm text-gray-500">{job.duration}</p>
                          </div>
                          <div className="flex items-center">
                            <StarIconSolid className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{job.rating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Availability</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedEmployee.availability === 'Available' ? 'bg-green-100 text-green-800' :
                        selectedEmployee.availability === 'Looking' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedEmployee.availability}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Expected Salary</span>
                      <span>₹{selectedEmployee.expectedSalary.toLocaleString()}/month</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Experience</span>
                      <span>{selectedEmployee.experience} years</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Documents</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedEmployee.documents).map(([key, status]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        {Array.isArray(status) ? (
                          <span className="text-sm text-gray-600">{status.length} files</span>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            status === 'verified' ? 'bg-green-100 text-green-800' :
                            status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
                    Send Message
                  </button>
                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
                    Schedule Interview
                  </button>
                  <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50">
                    Save to Favorites
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employee Search & Hiring</h1>
        <p className="text-gray-600 mt-2">Search, verify, and hire qualified employees for your restaurant</p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-2 px-1 ${activeTab === 'search' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Search Employees
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`pb-2 px-1 ${activeTab === 'jobs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            My Job Posts ({mockJobPosts.length})
          </button>
        </div>
      </div>

      {activeTab === 'search' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, skills, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Locations</option>
                  <option value="cp">Connaught Place</option>
                  <option value="kb">Karol Bagh</option>
                  <option value="dwarka">Dwarka</option>
                </select>
                <select
                  value={filters.experience}
                  onChange={(e) => setFilters({...filters, experience: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-5">2-5 years</option>
                  <option value="5+">5+ years</option>
                </select>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Status</option>
                  <option value="available">Available</option>
                  <option value="looking">Looking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Available Employees ({filteredEmployees.length})
              </h2>
              <button
                onClick={() => setShowCreateJob(true)}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Post Job Opening
              </button>
            </div>

            <div className="space-y-4">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(renderEmployeeCard)
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">My Job Posts</h2>
            <button
              onClick={() => setShowCreateJob(true)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Job Post
            </button>
          </div>

          <div className="space-y-4">
            {mockJobPosts.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      {job.urgent && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Urgent</span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.requirements.map((req, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {req}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
                        ₹{job.salary.min.toLocaleString()} - ₹{job.salary.max.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {job.type}
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {job.applicants} applicants
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md">
                      View Applicants
                    </button>
                    <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEmployee && renderEmployeeDetails()}
    </div>
  )
}