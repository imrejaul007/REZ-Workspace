'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  StarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  UserCircleIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon as CheckCircleSolid, 
  ClockIcon as ClockSolid,
  EyeIcon as EyeSolid
} from '@heroicons/react/24/solid'

interface Application {
  id: string
  job: {
    id: string
    title: string
    restaurant: {
      name: string
      logo: string
      location: string
      verified: boolean
    }
    type: string
    salary: {
      min: number
      max: number
      period: 'hourly' | 'yearly'
    }
    location: string
  }
  status: 'applied' | 'viewed' | 'in-review' | 'interview' | 'rejected' | 'offered'
  appliedDate: string
  lastUpdate: string
  matchScore: number
  hasNewMessages: boolean
  interviewScheduled?: {
    date: string
    time: string
    type: 'phone' | 'video' | 'in-person'
    location?: string
  }
  feedback?: string
  nextSteps?: string
}

const mockApplications: Application[] = [
  {
    id: '1',
    job: {
      id: '1',
      title: 'Head Chef',
      restaurant: {
        name: 'The French Bistro',
        logo: '/restaurant-logos/french-bistro.jpg',
        location: 'New York, NY',
        verified: true
      },
      type: 'Full-time',
      salary: {
        min: 85000,
        max: 120000,
        period: 'yearly'
      },
      location: 'Manhattan, NY'
    },
    status: 'interview',
    appliedDate: '2024-03-10',
    lastUpdate: '2024-03-15',
    matchScore: 92,
    hasNewMessages: true,
    interviewScheduled: {
      date: '2024-03-18',
      time: '2:00 PM',
      type: 'in-person',
      location: 'The French Bistro, 123 Main St, New York, NY'
    },
    nextSteps: 'Prepare for final interview with the owner'
  },
  {
    id: '2',
    job: {
      id: '2',
      title: 'Line Cook',
      restaurant: {
        name: 'Tokyo Sushi Bar',
        logo: '/restaurant-logos/tokyo-sushi.jpg',
        location: 'Los Angeles, CA',
        verified: true
      },
      type: 'Full-time',
      salary: {
        min: 22,
        max: 28,
        period: 'hourly'
      },
      location: 'Downtown LA, CA'
    },
    status: 'offered',
    appliedDate: '2024-03-12',
    lastUpdate: '2024-03-16',
    matchScore: 78,
    hasNewMessages: true,
    feedback: 'Great interview! We would love to have you join our team.',
    nextSteps: 'Please review the offer and let us know by March 20th'
  },
  {
    id: '3',
    job: {
      id: '3',
      title: 'Restaurant Manager',
      restaurant: {
        name: 'Garden Terrace',
        logo: '/restaurant-logos/garden-terrace.jpg',
        location: 'Chicago, IL',
        verified: false
      },
      type: 'Full-time',
      salary: {
        min: 60000,
        max: 75000,
        period: 'yearly'
      },
      location: 'Chicago, IL'
    },
    status: 'in-review',
    appliedDate: '2024-03-08',
    lastUpdate: '2024-03-14',
    matchScore: 85,
    hasNewMessages: false,
    nextSteps: 'Application under review by hiring manager'
  },
  {
    id: '4',
    job: {
      id: '4',
      title: 'Sous Chef',
      restaurant: {
        name: 'Italian Corner',
        logo: '/restaurant-logos/italian-corner.jpg',
        location: 'Boston, MA',
        verified: true
      },
      type: 'Full-time',
      salary: {
        min: 55000,
        max: 70000,
        period: 'yearly'
      },
      location: 'North End, Boston'
    },
    status: 'rejected',
    appliedDate: '2024-03-05',
    lastUpdate: '2024-03-13',
    matchScore: 65,
    hasNewMessages: false,
    feedback: 'Thank you for your interest. We have decided to move forward with another candidate who has more experience in Italian cuisine.'
  },
  {
    id: '5',
    job: {
      id: '5',
      title: 'Server',
      restaurant: {
        name: 'Rooftop Lounge',
        logo: '/restaurant-logos/rooftop-lounge.jpg',
        location: 'Miami, FL',
        verified: true
      },
      type: 'Part-time',
      salary: {
        min: 15,
        max: 25,
        period: 'hourly'
      },
      location: 'South Beach, Miami'
    },
    status: 'viewed',
    appliedDate: '2024-03-14',
    lastUpdate: '2024-03-15',
    matchScore: 70,
    hasNewMessages: false
  }
]

export default function EmployeeDashboard() {
  const router = useRouter()
  const [applications] = useState<Application[]>(mockApplications)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const statusFilters = [
    { id: 'all', name: 'All Applications', count: applications.length },
    { id: 'in-review', name: 'In Review', count: applications.filter(a => a.status === 'in-review').length },
    { id: 'interview', name: 'Interview', count: applications.filter(a => a.status === 'interview').length },
    { id: 'offered', name: 'Offers', count: applications.filter(a => a.status === 'offered').length },
    { id: 'rejected', name: 'Rejected', count: applications.filter(a => a.status === 'rejected').length }
  ]

  const filteredApplications = applications.filter(app => {
    const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus
    const matchesSearch = app.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.job.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied':
        return <ClockIcon className="w-5 h-5 text-blue-500" />
      case 'viewed':
        return <EyeIcon className="w-5 h-5 text-purple-500" />
      case 'in-review':
        return <ClockSolid className="w-5 h-5 text-yellow-500" />
      case 'interview':
        return <UserCircleIcon className="w-5 h-5 text-orange-500" />
      case 'offered':
        return <CheckCircleSolid className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'viewed':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'in-review':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'interview':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'offered':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatSalary = (salary: Application['job']['salary']) => {
    if (salary.period === 'hourly') {
      return `$${salary.min}-${salary.max}/hr`
    }
    return `$${(salary.min / 1000).toFixed(0)}k-${(salary.max / 1000).toFixed(0)}k/year`
  }

  const getDaysAgo = (date: string) => {
    const posted = new Date(date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return `${Math.floor(diff / 30)} months ago`
  }

  const openChat = (applicationId: string) => {
    router.push(`/jobs/chat/${applicationId}`)
  }

  const activeApplications = applications.filter(a => ['applied', 'viewed', 'in-review', 'interview'].includes(a.status))
  const totalOffers = applications.filter(a => a.status === 'offered').length
  const averageMatchScore = Math.round(applications.reduce((sum, app) => sum + app.matchScore, 0) / applications.length)
  const newMessages = applications.filter(a => a.hasNewMessages).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Dashboard</h1>
              <p className="text-gray-600 mt-2">Track your job applications and opportunities</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/jobs')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Browse Jobs
              </button>
              <button
                onClick={() => router.push('/profile/edit')}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Applications</p>
                <p className="text-2xl font-bold text-gray-900">{activeApplications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Job Offers</p>
                <p className="text-2xl font-bold text-gray-900">{totalOffers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Match</p>
                <p className="text-2xl font-bold text-gray-900">{averageMatchScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Messages</p>
                <p className="text-2xl font-bold text-gray-900">{newMessages}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filter by Status</h3>
              <div className="space-y-2">
                {statusFilters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedStatus(filter.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedStatus === filter.id 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{filter.name}</span>
                    <span className="text-sm text-gray-500">{filter.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => router.push('/jobs/saved')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Saved Jobs
                </button>
                <button
                  onClick={() => router.push('/jobs/alerts')}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Job Alerts
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {application.job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mt-1">
                          <span>{application.job.restaurant.name}</span>
                          {application.job.restaurant.verified && (
                            <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {application.job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <BriefcaseIcon className="w-4 h-4" />
                            {application.job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            {formatSalary(application.job.salary)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                      </div>
                      {application.matchScore && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <StarIcon className="w-4 h-4 text-yellow-400" />
                          {application.matchScore}% match
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interview Details */}
                  {application.interviewScheduled && (
                    <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-700">Interview Scheduled</span>
                      </div>
                      <div className="text-sm text-orange-600">
                        <p>{application.interviewScheduled.date} at {application.interviewScheduled.time}</p>
                        <p className="capitalize">{application.interviewScheduled.type} interview</p>
                        {application.interviewScheduled.location && (
                          <p>{application.interviewScheduled.location}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {application.feedback && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-700">Feedback</span>
                      </div>
                      <p className="text-sm text-blue-600">{application.feedback}</p>
                    </div>
                  )}

                  {/* Next Steps */}
                  {application.nextSteps && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-700">Next Steps</span>
                      </div>
                      <p className="text-sm text-green-600">{application.nextSteps}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Applied {getDaysAgo(application.appliedDate)}</span>
                      <span>Updated {getDaysAgo(application.lastUpdate)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/jobs/${application.job.id}`)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View Job
                      </button>
                      
                      <button
                        onClick={() => openChat(application.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 relative"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        Chat
                        {application.hasNewMessages && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-500 mb-4">
                    {selectedStatus === 'all' 
                      ? "You haven't applied to any jobs yet"
                      : `No applications with status: ${selectedStatus.replace('-', ' ')}`
                    }
                  </p>
                  <button
                    onClick={() => router.push('/jobs')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Browse Jobs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}