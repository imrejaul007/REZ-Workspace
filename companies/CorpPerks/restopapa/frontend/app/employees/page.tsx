'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  StarIcon,
  MapPinIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface Employee {
  id: number
  name: string
  role: string
  specialties: string[]
  experience: string
  location: string
  rating: number
  reviewCount: number
  verified: boolean
  available: boolean
  hourlyRate: string
  avatar: string
  bio: string
  lastActive: string
  completedJobs: number
  skills: string[]
  certifications: string[]
}

const mockEmployees: Employee[] = [
  {
    id: 1,
    name: 'Maria Rodriguez',
    role: 'Head Chef',
    specialties: ['Italian Cuisine', 'Pasta Making', 'Wine Pairing'],
    experience: '8+ years',
    location: 'San Francisco, CA',
    rating: 4.9,
    reviewCount: 127,
    verified: true,
    available: true,
    hourlyRate: '$35-45',
    avatar: '👩‍🍳',
    bio: 'Passionate chef specializing in authentic Italian cuisine with over 8 years of experience in fine dining establishments.',
    lastActive: '2 hours ago',
    completedJobs: 43,
    skills: ['Menu Planning', 'Kitchen Management', 'Staff Training'],
    certifications: ['ServSafe Manager', 'Culinary Arts Degree']
  },
  {
    id: 2,
    name: 'James Thompson',
    role: 'Sous Chef',
    specialties: ['French Cuisine', 'Pastry', 'Molecular Gastronomy'],
    experience: '5+ years',
    location: 'Los Angeles, CA',
    rating: 4.7,
    reviewCount: 89,
    verified: true,
    available: false,
    hourlyRate: '$28-35',
    avatar: '👨‍🍳',
    bio: 'Creative sous chef with expertise in French techniques and modern culinary innovations.',
    lastActive: '1 day ago',
    completedJobs: 31,
    skills: ['Sauce Making', 'Pastry Arts', 'Innovation'],
    certifications: ['Le Cordon Bleu', 'HACCP Certified']
  },
  {
    id: 3,
    name: 'Sarah Chen',
    role: 'Server',
    specialties: ['Fine Dining Service', 'Wine Service', 'Customer Relations'],
    experience: '4+ years',
    location: 'New York, NY',
    rating: 4.8,
    reviewCount: 156,
    verified: true,
    available: true,
    hourlyRate: '$18-25',
    avatar: '👩‍💼',
    bio: 'Professional server with extensive experience in upscale dining establishments and wine service.',
    lastActive: '30 minutes ago',
    completedJobs: 67,
    skills: ['Wine Knowledge', 'POS Systems', 'Conflict Resolution'],
    certifications: ['Sommelier Level 1', 'Food Handler\'s License']
  },
  {
    id: 4,
    name: 'Alex Martinez',
    role: 'Bartender',
    specialties: ['Craft Cocktails', 'Mixology', 'Bar Management'],
    experience: '6+ years',
    location: 'Austin, TX',
    rating: 4.6,
    reviewCount: 94,
    verified: false,
    available: true,
    hourlyRate: '$22-30',
    avatar: '🍸',
    bio: 'Expert mixologist specializing in craft cocktails and bar operations management.',
    lastActive: '4 hours ago',
    completedJobs: 38,
    skills: ['Inventory Management', 'Customer Service', 'Cost Control'],
    certifications: ['TABC Certified', 'Responsible Beverage Service']
  },
  {
    id: 5,
    name: 'Elena Vasquez',
    role: 'Line Cook',
    specialties: ['Grill Station', 'Prep Work', 'Mexican Cuisine'],
    experience: '3+ years',
    location: 'Phoenix, AZ',
    rating: 4.5,
    reviewCount: 72,
    verified: true,
    available: true,
    hourlyRate: '$16-22',
    avatar: '👩‍🍳',
    bio: 'Dedicated line cook with strong fundamentals and expertise in Mexican and Southwestern cuisine.',
    lastActive: '1 hour ago',
    completedJobs: 29,
    skills: ['Grill Operations', 'Food Safety', 'Team Collaboration'],
    certifications: ['Food Handler\'s License', 'ServSafe Food Handler']
  },
  {
    id: 6,
    name: 'David Kim',
    role: 'Restaurant Manager',
    specialties: ['Operations Management', 'Staff Coordination', 'P&L Management'],
    experience: '7+ years',
    location: 'Seattle, WA',
    rating: 4.8,
    reviewCount: 103,
    verified: true,
    available: false,
    hourlyRate: '$40-55',
    avatar: '👨‍💼',
    bio: 'Experienced restaurant manager with proven track record in operations, staff development, and profitability.',
    lastActive: '3 hours ago',
    completedJobs: 52,
    skills: ['Leadership', 'Budget Management', 'Staff Training'],
    certifications: ['Restaurant Management Certificate', 'QuickBooks Pro']
  }
]

export default function EmployeesDirectory() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const roles = Array.from(new Set(employees.map(emp => emp.role)))
  const locations = Array.from(new Set(employees.map(emp => emp.location)))

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.specialties.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && employee.available) ||
                               (availabilityFilter === 'unavailable' && !employee.available)
    const matchesLocation = locationFilter === 'all' || employee.location === locationFilter
    const matchesVerified = !verifiedOnly || employee.verified

    return matchesSearch && matchesRole && matchesAvailability && matchesLocation && matchesVerified
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
              <p className="text-gray-600 mt-2">Find qualified restaurant professionals for your team</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {filteredEmployees.length} of {employees.length} employees
              </div>
              <button 
                onClick={() => router.push('/jobs/create')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Post a Job
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
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="lg:col-span-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className="lg:col-span-2">
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="lg:col-span-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Locations</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
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

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                      {employee.avatar}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                        {employee.verified && (
                          <ShieldCheckIcon className="w-4 h-4 text-blue-500 ml-2" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-blue-600">{employee.role}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                    employee.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {employee.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`w-4 h-4 ${
                        i < Math.floor(employee.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`} />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {employee.rating} ({employee.reviewCount} reviews)
                    </span>
                  </div>
                </div>

                {/* Location & Rate */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span className="mr-4">{employee.location}</span>
                  <span className="font-medium text-gray-900">{employee.hourlyRate}/hr</span>
                </div>

                {/* Experience */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <BriefcaseIcon className="w-4 h-4 mr-1" />
                  <span>{employee.experience} experience • {employee.completedJobs} jobs completed</span>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{employee.bio}</p>

                {/* Specialties */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {employee.specialties.slice(0, 3).map((specialty, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                    {employee.specialties.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{employee.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Last Active */}
                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  Last active {employee.lastActive}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/profile/employee/${employee.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <EyeIcon className="w-4 h-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => router.push(`/messages/compose?to=${employee.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('all')
                setAvailabilityFilter('all')
                setLocationFilter('all')
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