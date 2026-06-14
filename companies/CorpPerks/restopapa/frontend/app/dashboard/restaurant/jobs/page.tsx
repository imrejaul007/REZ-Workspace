'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface JobPosting {
  id: string
  title: string
  description: string
  requirements: string[]
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  experience: string
  salary: {
    min: number
    max: number
    period: 'hourly' | 'yearly'
  }
  status: 'active' | 'paused' | 'closed' | 'draft'
  postedDate: string
  expiresDate?: string
  applicants: number
  views: number
  newApplications: number
  isPromoted: boolean
  isUrgent: boolean
}

interface Application {
  id: string
  jobId: string
  jobTitle: string
  applicantName: string
  applicantEmail: string
  applicantAvatar: string
  appliedDate: string
  status: 'new' | 'reviewed' | 'interview' | 'offered' | 'rejected' | 'hired'
  matchScore: number
  hasNewMessages: boolean
  lastMessageDate?: string
  experience: string
  location: string
}

const mockJobs: JobPosting[] = [
  {
    id: '1',
    title: 'Head Chef',
    description: 'Lead our kitchen team and maintain high standards of French cuisine...',
    requirements: ['10+ years experience', 'Culinary degree', 'Leadership skills'],
    location: 'Manhattan, NY',
    type: 'full-time',
    experience: 'Senior level',
    salary: { min: 85000, max: 120000, period: 'yearly' },
    status: 'active',
    postedDate: '2024-03-10',
    applicants: 45,
    views: 1250,
    newApplications: 8,
    isPromoted: true,
    isUrgent: true
  },
  {
    id: '2',
    title: 'Sous Chef',
    description: 'Support the Head Chef and manage daily kitchen operations...',
    requirements: ['5+ years experience', 'French cuisine knowledge', 'Team player'],
    location: 'Manhattan, NY',
    type: 'full-time',
    experience: 'Mid level',
    salary: { min: 55000, max: 70000, period: 'yearly' },
    status: 'active',
    postedDate: '2024-03-12',
    applicants: 23,
    views: 567,
    newApplications: 3,
    isPromoted: false,
    isUrgent: false
  },
  {
    id: '3',
    title: 'Line Cook',
    description: 'Prepare dishes according to recipes and maintain kitchen standards...',
    requirements: ['2+ years experience', 'Food safety certification', 'Fast-paced environment'],
    location: 'Manhattan, NY',
    type: 'full-time',
    experience: 'Entry level',
    salary: { min: 18, max: 24, period: 'hourly' },
    status: 'paused',
    postedDate: '2024-03-08',
    applicants: 67,
    views: 890,
    newApplications: 0,
    isPromoted: false,
    isUrgent: false
  }
]

const mockApplications: Application[] = [
  {
    id: '1',
    jobId: '1',
    jobTitle: 'Head Chef',
    applicantName: 'John Smith',
    applicantEmail: 'john@example.com',
    applicantAvatar: '/avatars/john-smith.jpg',
    appliedDate: '2024-03-15',
    status: 'interview',
    matchScore: 92,
    hasNewMessages: true,
    lastMessageDate: '2024-03-16T10:30:00Z',
    experience: '12 years',
    location: 'New York, NY'
  },
  {
    id: '2',
    jobId: '1',
    jobTitle: 'Head Chef',
    applicantName: 'Sarah Johnson',
    applicantEmail: 'sarah@example.com',
    applicantAvatar: '/avatars/sarah-johnson.jpg',
    appliedDate: '2024-03-14',
    status: 'reviewed',
    matchScore: 85,
    hasNewMessages: false,
    experience: '8 years',
    location: 'Brooklyn, NY'
  },
  {
    id: '3',
    jobId: '2',
    jobTitle: 'Sous Chef',
    applicantName: 'Michael Brown',
    applicantEmail: 'michael@example.com',
    applicantAvatar: '/avatars/michael-brown.jpg',
    appliedDate: '2024-03-16',
    status: 'new',
    matchScore: 78,
    hasNewMessages: false,
    experience: '6 years',
    location: 'Manhattan, NY'
  },
  {
    id: '4',
    jobId: '1',
    jobTitle: 'Head Chef',
    applicantName: 'Emily Davis',
    applicantEmail: 'emily@example.com',
    applicantAvatar: '/avatars/emily-davis.jpg',
    appliedDate: '2024-03-13',
    status: 'offered',
    matchScore: 95,
    hasNewMessages: true,
    lastMessageDate: '2024-03-16T14:20:00Z',
    experience: '15 years',
    location: 'New York, NY'
  }
]

export default function RestaurantJobDashboard() {
  const router = useRouter()
  const [jobs] = useState<JobPosting[]>(mockJobs)
  const [applications] = useState<Application[]>(mockApplications)
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const formatSalary = (salary: JobPosting['salary']) => {
    if (salary.period === 'hourly') {
      return `$${salary.min}-${salary.max}/hr`
    }
    return `$${(salary.min / 1000).toFixed(0)}k-${(salary.max / 1000).toFixed(0)}k/year`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'paused':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'draft':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'reviewed':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'interview':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'offered':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'hired':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalJobs = jobs.length
  const activeJobs = jobs.filter(j => j.status === 'active').length
  const totalApplications = applications.length
  const newApplications = applications.filter(a => a.status === 'new').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
              <p className="text-gray-600 mt-2">Manage your job postings and applications</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/restaurant/jobs/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Post New Job
            </button>
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
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{activeJobs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowTrendingUpIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Applications</p>
                <p className="text-2xl font-bold text-gray-900">{newApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-6 py-4 font-medium text-sm border-b-2 ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Job Postings ({totalJobs})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-4 font-medium text-sm border-b-2 ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Applications ({totalApplications})
                {newApplications > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {newApplications}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {activeTab === 'jobs' ? (
                  <>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </>
                ) : (
                  <>
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="interview">Interview</option>
                    <option value="offered">Offered</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </>
                )}
              </select>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'jobs' ? (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </div>
                          {job.isPromoted && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              Promoted
                            </span>
                          )}
                          {job.isUrgent && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              Urgent
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <BriefcaseIcon className="w-4 h-4" />
                            {job.type}
                          </div>
                          <div className="flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            {formatSalary(job.salary)}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {job.experience}
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <UserGroupIcon className="w-4 h-4" />
                            {job.applicants} applicants
                          </div>
                          <div className="flex items-center gap-1">
                            <EyeIcon className="w-4 h-4" />
                            {job.views} views
                          </div>
                          <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                          {job.newApplications > 0 && (
                            <span className="text-blue-600 font-medium">
                              {job.newApplications} new applications
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="View Job"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/restaurant/jobs/edit/${job.id}`)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Edit Job"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600" title="Delete Job">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="text-center py-12">
                    <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-500 mb-4">Create your first job posting to start hiring</p>
                    <button
                      onClick={() => router.push('/dashboard/restaurant/jobs/create')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Post New Job
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{application.applicantName}</h3>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(application.status)}`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <StarIcon className="w-4 h-4 text-yellow-400" />
                              {application.matchScore}% match
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-2">Applied for: {application.jobTitle}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                            <span>{application.experience} experience</span>
                            <span>{application.location}</span>
                            <span>Applied {new Date(application.appliedDate).toLocaleDateString()}</span>
                          </div>

                          {application.hasNewMessages && application.lastMessageDate && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <ChatBubbleLeftRightIcon className="w-4 h-4" />
                              New message {new Date(application.lastMessageDate).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => router.push(`/jobs/chat/${application.id}`)}
                          className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 relative"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          Chat
                          {application.hasNewMessages && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                          )}
                        </button>
                        <button
                          onClick={() => router.push(`/jobs/applications`)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                          <DocumentTextIcon className="w-4 h-4" />
                          View Application
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredApplications.length === 0 && (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                    <p className="text-gray-500">Applications will appear here when people apply to your jobs</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}