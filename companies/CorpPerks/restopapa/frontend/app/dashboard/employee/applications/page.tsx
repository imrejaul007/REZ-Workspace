'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface JobApplication {
  id: number
  jobId: number
  jobTitle: string
  restaurant: {
    name: string
    logo: string
    location: string
  }
  appliedDate: string
  status: 'pending' | 'reviewing' | 'interview_scheduled' | 'rejected' | 'offered' | 'hired'
  salary: string
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary'
  priority: 'high' | 'medium' | 'low'
  notes?: string
  nextAction?: {
    type: 'interview' | 'call' | 'document' | 'decision'
    date: string
    details: string
  }
  timeline: {
    date: string
    status: string
    message: string
  }[]
}

const mockApplications: JobApplication[] = [
  {
    id: 1,
    jobId: 101,
    jobTitle: 'Senior Sous Chef',
    restaurant: {
      name: 'Ocean Grill',
      logo: '🦞',
      location: 'Boston, MA'
    },
    appliedDate: '2024-03-15',
    status: 'interview_scheduled',
    salary: '$65,000 - $75,000',
    jobType: 'Full-time',
    priority: 'high',
    notes: 'Great opportunity for career growth. They loved my Italian cuisine experience.',
    nextAction: {
      type: 'interview',
      date: '2024-03-25',
      details: 'In-person interview at 2:00 PM with Chef Manager and HR'
    },
    timeline: [
      { date: '2024-03-15', status: 'Applied', message: 'Application submitted successfully' },
      { date: '2024-03-17', status: 'Reviewing', message: 'Application under review' },
      { date: '2024-03-20', status: 'Interview Scheduled', message: 'Interview scheduled for March 25th' }
    ]
  },
  {
    id: 2,
    jobId: 102,
    jobTitle: 'Line Cook',
    restaurant: {
      name: 'Fresh Garden Bistro',
      logo: '🥗',
      location: 'Miami, FL'
    },
    appliedDate: '2024-03-18',
    status: 'reviewing',
    salary: '$18-22/hour',
    jobType: 'Full-time',
    priority: 'medium',
    timeline: [
      { date: '2024-03-18', status: 'Applied', message: 'Application submitted successfully' },
      { date: '2024-03-19', status: 'Reviewing', message: 'Application under review by hiring manager' }
    ]
  },
  {
    id: 3,
    jobId: 103,
    jobTitle: 'Prep Cook',
    restaurant: {
      name: 'Downtown Deli',
      logo: '🥪',
      location: 'Miami, FL'
    },
    appliedDate: '2024-03-10',
    status: 'rejected',
    salary: '$16-18/hour',
    jobType: 'Part-time',
    priority: 'low',
    notes: 'Position filled by internal candidate. Keep looking for similar roles.',
    timeline: [
      { date: '2024-03-10', status: 'Applied', message: 'Application submitted successfully' },
      { date: '2024-03-12', status: 'Reviewing', message: 'Application under review' },
      { date: '2024-03-14', status: 'Rejected', message: 'Position filled by internal candidate' }
    ]
  },
  {
    id: 4,
    jobId: 104,
    jobTitle: 'Head Chef',
    restaurant: {
      name: 'Bella Vista Restaurant',
      logo: '🍝',
      location: 'Fort Lauderdale, FL'
    },
    appliedDate: '2024-03-12',
    status: 'offered',
    salary: '$70,000 - $80,000',
    jobType: 'Full-time',
    priority: 'high',
    notes: 'Excellent offer! Need to respond by March 28th.',
    nextAction: {
      type: 'decision',
      date: '2024-03-28',
      details: 'Decision deadline for job offer'
    },
    timeline: [
      { date: '2024-03-12', status: 'Applied', message: 'Application submitted successfully' },
      { date: '2024-03-14', status: 'Reviewing', message: 'Application under review' },
      { date: '2024-03-16', status: 'Interview Scheduled', message: 'Phone interview scheduled' },
      { date: '2024-03-18', status: 'Interviewed', message: 'Completed phone interview' },
      { date: '2024-03-20', status: 'Offered', message: 'Job offer received - Decision needed by March 28th' }
    ]
  }
]

export default function EmployeeApplications() {
  const router = useRouter()
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewing': return 'bg-blue-100 text-blue-800'
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'offered': return 'bg-green-100 text-green-800'
      case 'hired': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="w-4 h-4" />
      case 'reviewing': return <EyeIcon className="w-4 h-4" />
      case 'interview_scheduled': return <CalendarIcon className="w-4 h-4" />
      case 'rejected': return <XCircleIcon className="w-4 h-4" />
      case 'offered': return <CheckCircleIcon className="w-4 h-4" />
      case 'hired': return <CheckCircleIcon className="w-4 h-4" />
      default: return <ClockIcon className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApplicationStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewing: applications.filter(a => a.status === 'reviewing').length,
      interviews: applications.filter(a => a.status === 'interview_scheduled').length,
      offers: applications.filter(a => a.status === 'offered').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    }
  }

  const stats = getApplicationStats()

  const formatStatusText = (status: string) => {
    switch (status) {
      case 'interview_scheduled': return 'Interview Scheduled'
      case 'pending': return 'Pending'
      case 'reviewing': return 'Under Review'
      case 'rejected': return 'Rejected'
      case 'offered': return 'Offer Received'
      case 'hired': return 'Hired'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
              <p className="text-gray-600 mt-1">Track your job applications and their progress</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              <BriefcaseIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.reviewing}</p>
                <p className="text-sm text-gray-600">Reviewing</p>
              </div>
              <EyeIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.interviews}</p>
                <p className="text-sm text-gray-600">Interviews</p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.offers}</p>
                <p className="text-sm text-gray-600">Offers</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
              <XCircleIcon className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Under Review</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="offered">Offer Received</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {application.restaurant.logo}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{application.jobTitle}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="ml-1">{formatStatusText(application.status)}</span>
                        </span>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(application.priority)}`}>
                          {application.priority} priority
                        </span>
                      </div>
                      
                      <p className="text-blue-600 font-medium mt-1">{application.restaurant.name}</p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {application.restaurant.location}
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                          {application.salary}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {application.jobType}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          Applied {new Date(application.appliedDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {application.nextAction && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center text-blue-800">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            <span className="font-medium">Next Action: </span>
                            <span className="ml-1">{application.nextAction.details}</span>
                            <span className="ml-2 text-blue-600">
                              ({new Date(application.nextAction.date).toLocaleDateString()})
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {application.notes && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-start">
                            <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                            <p className="text-sm text-gray-700">{application.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedApplication(application)
                        setShowDetails(true)
                      }}
                      className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => router.push(`/jobs/${application.jobId}`)}
                      className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <BriefcaseIcon className="w-4 h-4 mr-2" />
                      View Job
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500 mb-4">Start applying to jobs to track your progress here</p>
            <button
              onClick={() => router.push('/dashboard/employee/jobs')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Jobs
            </button>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Application Timeline</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-2">
                <h3 className="font-semibold text-gray-900">{selectedApplication.jobTitle}</h3>
                <p className="text-blue-600">{selectedApplication.restaurant.name}</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {selectedApplication.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{event.status}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
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