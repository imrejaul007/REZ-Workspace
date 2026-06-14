'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BuildingStorefrontIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface AppliedJob {
  id: number
  job: {
    id: number
    title: string
    department: string
    type: 'full-time' | 'part-time' | 'contract' | 'internship'
    salary: {
      min: number
      max: number
      period: 'hour' | 'year'
    }
    location: string
    description: string
    requirements: string[]
  }
  restaurant: {
    id: number
    name: string
    logo: string
    rating: number
    location: string
    verified: boolean
  }
  application: {
    appliedDate: string
    status: 'pending' | 'reviewed' | 'interviewed' | 'offered' | 'hired' | 'rejected' | 'withdrawn'
    lastUpdate: string
    notes: string
    interviewDate?: string
    feedback?: string
  }
  matchScore: number
}

const mockAppliedJobs: AppliedJob[] = [
  {
    id: 1,
    job: {
      id: 101,
      title: 'Head Chef',
      department: 'Kitchen',
      type: 'full-time',
      salary: { min: 70000, max: 85000, period: 'year' },
      location: 'Downtown San Francisco',
      description: 'Lead our kitchen team in creating exceptional Italian cuisine...',
      requirements: ['8+ years culinary experience', 'Leadership skills', 'Italian cuisine expertise']
    },
    restaurant: {
      id: 201,
      name: 'Bella Italia Ristorante',
      logo: '🍝',
      rating: 4.8,
      location: 'San Francisco, CA',
      verified: true
    },
    application: {
      appliedDate: '2024-03-15T10:30:00Z',
      status: 'interviewed',
      lastUpdate: '2024-03-18T14:20:00Z',
      notes: 'Great interview, awaiting final decision',
      interviewDate: '2024-03-18T14:00:00Z',
      feedback: 'Impressed with culinary skills and leadership experience'
    },
    matchScore: 95
  },
  {
    id: 2,
    job: {
      id: 102,
      title: 'Sous Chef',
      department: 'Kitchen',
      type: 'full-time',
      salary: { min: 55000, max: 65000, period: 'year' },
      location: 'Union Square',
      description: 'Support head chef in daily kitchen operations...',
      requirements: ['5+ years experience', 'French cuisine knowledge', 'Team collaboration']
    },
    restaurant: {
      id: 202,
      name: 'Le Petit Bistro',
      logo: '🥐',
      rating: 4.7,
      location: 'San Francisco, CA',
      verified: true
    },
    application: {
      appliedDate: '2024-03-12T09:15:00Z',
      status: 'offered',
      lastUpdate: '2024-03-19T11:30:00Z',
      notes: 'Received job offer, considering terms',
      feedback: 'Excellent technical skills, great cultural fit'
    },
    matchScore: 88
  },
  {
    id: 3,
    job: {
      id: 103,
      title: 'Line Cook',
      department: 'Kitchen',
      type: 'full-time',
      salary: { min: 18, max: 22, period: 'hour' },
      location: 'Mission District',
      description: 'Prepare dishes according to restaurant standards...',
      requirements: ['2+ years experience', 'Fast-paced environment', 'Food safety knowledge']
    },
    restaurant: {
      id: 203,
      name: 'Urban Grill',
      logo: '🍔',
      rating: 4.5,
      location: 'San Francisco, CA',
      verified: false
    },
    application: {
      appliedDate: '2024-03-10T16:45:00Z',
      status: 'rejected',
      lastUpdate: '2024-03-14T10:00:00Z',
      notes: 'Position filled by internal candidate',
      feedback: 'Strong application, but chose internal candidate'
    },
    matchScore: 75
  },
  {
    id: 4,
    job: {
      id: 104,
      title: 'Pastry Chef',
      department: 'Kitchen',
      type: 'part-time',
      salary: { min: 25, max: 30, period: 'hour' },
      location: 'Nob Hill',
      description: 'Create beautiful desserts and pastries...',
      requirements: ['Pastry school certification', 'Creative portfolio', 'Attention to detail']
    },
    restaurant: {
      id: 204,
      name: 'Sweet Dreams Bakery',
      logo: '🧁',
      rating: 4.9,
      location: 'San Francisco, CA',
      verified: true
    },
    application: {
      appliedDate: '2024-03-08T13:20:00Z',
      status: 'pending',
      lastUpdate: '2024-03-08T13:20:00Z',
      notes: 'Submitted application with portfolio'
    },
    matchScore: 82
  }
]

export default function AppliedJobs() {
  const router = useRouter()
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>(mockAppliedJobs)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')

  const filteredJobs = appliedJobs.filter(job => {
    const matchesSearch = job.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.application.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.application.appliedDate).getTime() - new Date(a.application.appliedDate).getTime()
      case 'match':
        return b.matchScore - a.matchScore
      case 'salary':
        const aSalary = a.job.salary.period === 'hour' ? a.job.salary.max * 2080 : a.job.salary.max
        const bSalary = b.job.salary.period === 'hour' ? b.job.salary.max * 2080 : b.job.salary.max
        return bSalary - aSalary
      default:
        return 0
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100'
      case 'reviewed': return 'text-blue-700 bg-blue-100'
      case 'interviewed': return 'text-purple-700 bg-purple-100'
      case 'offered': return 'text-green-700 bg-green-100'
      case 'hired': return 'text-green-700 bg-green-200'
      case 'rejected': return 'text-red-700 bg-red-100'
      case 'withdrawn': return 'text-gray-700 bg-gray-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return ClockIcon
      case 'reviewed': return EyeIcon
      case 'interviewed': return ChatBubbleLeftRightIcon
      case 'offered': return CheckCircleIcon
      case 'hired': return CheckCircleIcon
      case 'rejected': return XCircleIcon
      case 'withdrawn': return XCircleIcon
      default: return ClockIcon
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const withdrawApplication = (jobId: number) => {
    if (confirm('Are you sure you want to withdraw this application?')) {
      setAppliedJobs(jobs =>
        jobs.map(job =>
          job.id === jobId
            ? { ...job, application: { ...job.application, status: 'withdrawn' as any } }
            : job
        )
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Applied Jobs</h1>
              <p className="text-gray-600 mt-2">Track the status of your job applications</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {filteredJobs.length} of {appliedJobs.length} applications
              </div>
              <button 
                onClick={() => router.push('/jobs')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse Jobs
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs or restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="interviewed">Interviewed</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="match">Best Match</option>
                <option value="salary">Highest Salary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Application Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {appliedJobs.filter(job => ['pending', 'reviewed', 'interviewed'].includes(job.application.status)).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {appliedJobs.filter(job => job.application.status === 'offered').length}
            </div>
            <div className="text-sm text-gray-600">Offers</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {appliedJobs.filter(job => job.application.status === 'interviewed').length}
            </div>
            <div className="text-sm text-gray-600">Interviewed</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(appliedJobs.reduce((sum, job) => sum + job.matchScore, 0) / appliedJobs.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Match</div>
          </div>
        </div>

        {/* Applied Jobs List */}
        <div className="space-y-6">
          {sortedJobs.map((appliedJob) => {
            const StatusIcon = getStatusIcon(appliedJob.application.status)
            
            return (
              <div key={appliedJob.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl mr-4">
                        {appliedJob.restaurant.logo}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{appliedJob.job.title}</h3>
                        <p className="text-blue-600 font-medium">{appliedJob.restaurant.name}</p>
                        <div className="flex items-center mt-1 text-sm text-gray-600">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {appliedJob.job.location}
                          {appliedJob.restaurant.verified && (
                            <span className="ml-2 text-blue-600">✓ Verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 text-sm font-medium rounded-full ${getMatchScoreColor(appliedJob.matchScore)}`}>
                        {appliedJob.matchScore}% Match
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(appliedJob.application.status)}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {appliedJob.application.status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Job Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Job Details</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <BriefcaseIcon className="w-4 h-4 mr-2" />
                          <span className="capitalize">{appliedJob.job.type}</span>
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                          ${appliedJob.job.salary.min.toLocaleString()} - ${appliedJob.job.salary.max.toLocaleString()} 
                          /{appliedJob.job.salary.period}
                        </div>
                        <div className="flex items-center">
                          <BuildingStorefrontIcon className="w-4 h-4 mr-2" />
                          {appliedJob.job.department}
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="w-4 h-4 mr-2" />
                          {appliedJob.restaurant.rating}/5.0 restaurant rating
                        </div>
                      </div>
                    </div>

                    {/* Application Timeline */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Application Status</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Applied:</span>
                          <span className="ml-2 font-medium">
                            {new Date(appliedJob.application.appliedDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Update:</span>
                          <span className="ml-2 font-medium">
                            {new Date(appliedJob.application.lastUpdate).toLocaleDateString()}
                          </span>
                        </div>
                        {appliedJob.application.interviewDate && (
                          <div>
                            <span className="text-gray-600">Interview:</span>
                            <span className="ml-2 font-medium text-purple-600">
                              {new Date(appliedJob.application.interviewDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {appliedJob.application.feedback && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-blue-800">
                            <strong>Feedback:</strong> {appliedJob.application.feedback}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => router.push(`/jobs/${appliedJob.job.id}`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Job Details
                        </button>
                        
                        <button
                          onClick={() => router.push(`/profile/restaurant/${appliedJob.restaurant.id}`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50"
                        >
                          <BuildingStorefrontIcon className="w-4 h-4" />
                          View Restaurant
                        </button>

                        {appliedJob.application.status === 'offered' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button className="flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                              <CheckCircleIcon className="w-3 h-3" />
                              Accept
                            </button>
                            <button className="flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                              <XCircleIcon className="w-3 h-3" />
                              Decline
                            </button>
                          </div>
                        )}

                        {['pending', 'reviewed'].includes(appliedJob.application.status) && (
                          <button
                            onClick={() => withdrawApplication(appliedJob.id)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-red-600 text-red-600 rounded text-sm hover:bg-red-50"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Withdraw Application
                          </button>
                        )}

                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          Message Restaurant
                        </button>
                      </div>
                    </div>
                  </div>

                  {appliedJob.application.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                      <p className="text-sm text-gray-600">{appliedJob.application.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applied jobs found</h3>
            <p className="text-gray-500 mb-4">
              {appliedJobs.length === 0 
                ? "You haven't applied to any jobs yet." 
                : "Try adjusting your search criteria or filters."
              }
            </p>
            {appliedJobs.length === 0 ? (
              <button
                onClick={() => router.push('/jobs')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse Available Jobs
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}