'use client'

import { useState } from 'react'
import {
  BriefcaseIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FlagIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  StarIcon,
  TrophyIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface Job {
  id: string
  title: string
  company: string
  companyId: string
  location: string
  department: string
  position: string
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary'
  salaryMin?: number
  salaryMax?: number
  experienceMin: number
  experienceMax?: number
  description: string
  requirements: string[]
  benefits: string[]
  status: 'open' | 'closed' | 'filled' | 'under_review' | 'flagged' | 'rejected'
  isPremium: boolean
  isFeatured: boolean
  postedAt: string
  expiresAt?: string
  lastUpdated: string
  applications: number
  views: number
  flags: {
    reason: string
    reportedBy: string
    reportedAt: string
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  }[]
  moderationNotes?: string
  companyRating: number
  companyTrustScore: number
}

interface JobApplication {
  id: string
  jobId: string
  jobTitle: string
  candidateName: string
  candidateEmail: string
  candidateId: string
  appliedAt: string
  status: 'pending' | 'shortlisted' | 'rejected' | 'hired'
  coverLetter?: string
  resumeUrl?: string
  experience: number
  currentLocation: string
  expectedSalary?: number
  noticePeriod?: string
  flags: string[]
}

const mockJobs: Job[] = [
  {
    id: 'JOB-001',
    title: 'Senior Chef - Indian Cuisine',
    company: 'Spice Garden Restaurant',
    companyId: 'REST-001',
    location: 'Mumbai, Maharashtra',
    department: 'Kitchen',
    position: 'Senior Chef',
    employmentType: 'full_time',
    salaryMin: 35000,
    salaryMax: 50000,
    experienceMin: 5,
    experienceMax: 10,
    description: 'We are looking for an experienced Senior Chef specializing in Indian cuisine to lead our kitchen team.',
    requirements: ['5+ years of experience', 'Expertise in Indian cuisine', 'Leadership skills'],
    benefits: ['Health insurance', 'Paid time off', 'Performance bonuses'],
    status: 'open',
    isPremium: true,
    isFeatured: true,
    postedAt: '2025-01-10T09:00:00Z',
    expiresAt: '2025-02-10T23:59:59Z',
    lastUpdated: '2025-01-10T09:00:00Z',
    applications: 23,
    views: 456,
    flags: [],
    companyRating: 4.5,
    companyTrustScore: 88
  },
  {
    id: 'JOB-002',
    title: 'Waiter - Immediate Joining',
    company: 'Quick Bites Cafe',
    companyId: 'REST-002',
    location: 'Delhi, NCR',
    department: 'Service',
    position: 'Waiter',
    employmentType: 'full_time',
    salaryMin: 18000,
    salaryMax: 25000,
    experienceMin: 0,
    experienceMax: 2,
    description: 'Looking for enthusiastic waiters to join our team immediately. No experience required.',
    requirements: ['Good communication skills', 'Willingness to learn', 'Customer service orientation'],
    benefits: ['Tips', 'Meal allowance', 'Flexible shifts'],
    status: 'flagged',
    isPremium: false,
    isFeatured: false,
    postedAt: '2025-01-12T14:30:00Z',
    expiresAt: '2025-01-22T23:59:59Z',
    lastUpdated: '2025-01-14T10:15:00Z',
    applications: 67,
    views: 234,
    flags: [
      {
        reason: 'Suspicious salary range - too low for location',
        reportedBy: 'system',
        reportedAt: '2025-01-14T10:15:00Z',
        status: 'pending'
      }
    ],
    companyRating: 3.2,
    companyTrustScore: 65
  },
  {
    id: 'JOB-003',
    title: 'Kitchen Manager',
    company: 'Food Court Express',
    companyId: 'REST-003',
    location: 'Bangalore, Karnataka',
    department: 'Kitchen',
    position: 'Kitchen Manager',
    employmentType: 'full_time',
    salaryMin: 45000,
    salaryMax: 65000,
    experienceMin: 3,
    experienceMax: 8,
    description: 'Seeking an experienced Kitchen Manager to oversee daily kitchen operations and manage staff.',
    requirements: ['Kitchen management experience', 'Food safety certification', 'Team leadership'],
    benefits: ['Health insurance', 'Performance incentives', 'Career growth'],
    status: 'under_review',
    isPremium: true,
    isFeatured: false,
    postedAt: '2025-01-08T11:00:00Z',
    lastUpdated: '2025-01-13T16:20:00Z',
    applications: 34,
    views: 189,
    flags: [
      {
        reason: 'Incomplete job description - missing specific responsibilities',
        reportedBy: 'moderator',
        reportedAt: '2025-01-13T16:20:00Z',
        status: 'reviewing'
      }
    ],
    moderationNotes: 'Job description needs more detail about daily responsibilities and reporting structure.',
    companyRating: 4.1,
    companyTrustScore: 75
  }
]

const mockApplications: JobApplication[] = [
  {
    id: 'APP-001',
    jobId: 'JOB-001',
    jobTitle: 'Senior Chef - Indian Cuisine',
    candidateName: 'Ravi Sharma',
    candidateEmail: 'ravi.sharma@email.com',
    candidateId: 'EMP-001',
    appliedAt: '2025-01-11T10:30:00Z',
    status: 'pending',
    experience: 7,
    currentLocation: 'Mumbai, Maharashtra',
    expectedSalary: 45000,
    noticePeriod: '30 days',
    flags: []
  },
  {
    id: 'APP-002',
    jobId: 'JOB-002',
    jobTitle: 'Waiter - Immediate Joining',
    candidateName: 'Priya Singh',
    candidateEmail: 'priya.singh@email.com',
    candidateId: 'EMP-002',
    appliedAt: '2025-01-13T14:15:00Z',
    status: 'shortlisted',
    experience: 1,
    currentLocation: 'Delhi, NCR',
    expectedSalary: 22000,
    noticePeriod: 'Immediate',
    flags: ['high_application_volume']
  }
]

export default function JobModeration() {
  const [activeTab, setActiveTab] = useState('jobs')
  const [jobs, setJobs] = useState(mockJobs)
  const [applications, setApplications] = useState(mockApplications)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [flagFilter, setFlagFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': case 'filled': return 'bg-blue-100 text-blue-800'
      case 'under_review': case 'reviewing': return 'bg-yellow-100 text-yellow-800'
      case 'flagged': case 'pending': return 'bg-red-100 text-red-800'
      case 'rejected': case 'dismissed': return 'bg-gray-100 text-gray-800'
      case 'shortlisted': case 'hired': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleJobAction = (jobId: string, action: 'approve' | 'reject' | 'feature' | 'unfeature' | 'flag') => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        switch (action) {
          case 'approve':
            return { ...job, status: 'open', flags: job.flags.map(f => ({ ...f, status: 'resolved' })) }
          case 'reject':
            return { ...job, status: 'rejected' }
          case 'feature':
            return { ...job, isFeatured: true }
          case 'unfeature':
            return { ...job, isFeatured: false }
          case 'flag':
            return { 
              ...job, 
              status: 'flagged',
              flags: [...job.flags, {
                reason: 'Flagged by admin for review',
                reportedBy: 'admin',
                reportedAt: new Date().toISOString(),
                status: 'pending'
              }]
            }
          default:
            return job
        }
      }
      return job
    }))
  }

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    const matchesFlags = flagFilter === 'all' || 
      (flagFilter === 'flagged' && job.flags.length > 0) ||
      (flagFilter === 'clean' && job.flags.length === 0)
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesFlags && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Portal Management</h1>
            <p className="text-gray-600 mt-2">Monitor and moderate job postings, applications, and employer activity</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
              Export Report
            </button>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Bulk Actions
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                <p className="text-sm text-green-600">
                  {jobs.filter(j => j.status === 'open').length} active
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Flagged Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.flags.length > 0).length}
                </p>
                <p className="text-sm text-red-600">Needs review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.reduce((sum, job) => sum + job.applications, 0)}
                </p>
                <p className="text-sm text-purple-600">Total received</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Premium Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.filter(j => j.isPremium).length}
                </p>
                <p className="text-sm text-yellow-600">
                  {jobs.filter(j => j.isFeatured).length} featured
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'jobs', name: 'Job Postings', icon: BriefcaseIcon },
              { id: 'applications', name: 'Applications', icon: DocumentTextIcon },
              { id: 'flagged', name: 'Flagged Content', icon: FlagIcon },
              { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search jobs..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="under_review">Under Review</option>
                    <option value="flagged">Flagged</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flags</label>
                  <select
                    value={flagFilter}
                    onChange={(e) => setFlagFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Jobs</option>
                    <option value="flagged">Flagged Only</option>
                    <option value="clean">Clean Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">All Types</option>
                    <option value="premium">Premium</option>
                    <option value="featured">Featured</option>
                    <option value="regular">Regular</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <BriefcaseIcon className="w-6 h-6 text-gray-500" />
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900">{job.title}</div>
                                {job.isPremium && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                    Premium
                                  </span>
                                )}
                                {job.isFeatured && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                                    <TrophyIcon className="w-3 h-3 mr-1" />
                                    Featured
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{job.position} • {job.department}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <MapPinIcon className="w-4 h-4 mr-1" />
                                {job.location}
                              </div>
                              {job.flags.length > 0 && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                    <FlagIcon className="w-3 h-3 mr-1" />
                                    {job.flags.length} flag{job.flags.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BuildingStorefrontIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{job.company}</div>
                              <div className="text-sm text-gray-500">{job.companyId}</div>
                              <div className="flex items-center mt-1">
                                <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="text-sm text-gray-500">{job.companyRating.toFixed(1)}</span>
                                <span className="text-sm text-gray-400 ml-2">Trust: {job.companyTrustScore}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {job.salaryMin && job.salaryMax ? (
                              <span>{formatCurrency(job.salaryMin)} - {formatCurrency(job.salaryMax)}</span>
                            ) : job.salaryMin ? (
                              <span>From {formatCurrency(job.salaryMin)}</span>
                            ) : (
                              <span className="text-gray-400">Not disclosed</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {job.employmentType.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                            {job.status.replace('_', ' ')}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Exp: {job.experienceMin}+ yrs
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Applications: {job.applications}</div>
                          <div>Views: {job.views}</div>
                          <div className="text-xs text-gray-500">
                            Posted: {new Date(job.postedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setSelectedJob(job)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {job.status === 'under_review' || job.status === 'flagged' ? (
                              <>
                                <button
                                  onClick={() => handleJobAction(job.id, 'approve')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve Job"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleJobAction(job.id, 'reject')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject Job"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleJobAction(job.id, 'flag')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Flag Job"
                              >
                                <FlagIcon className="w-4 h-4" />
                              </button>
                            )}
                            {job.status === 'open' && (
                              <button
                                onClick={() => handleJobAction(job.id, job.isFeatured ? 'unfeature' : 'feature')}
                                className="text-purple-600 hover:text-purple-900"
                                title={job.isFeatured ? 'Remove Featured' : 'Make Featured'}
                              >
                                <TrophyIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Flagged Content Tab */}
        {activeTab === 'flagged' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Flagged Jobs Requiring Review</h3>
              <div className="space-y-6">
                {jobs.filter(job => job.flags.length > 0).map((job) => (
                  <div key={job.id} className="border border-red-200 rounded-lg p-6 bg-red-50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
                        <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                        <p className="text-sm text-gray-500">Posted: {new Date(job.postedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {job.flags.map((flag, index) => (
                        <div key={index} className="bg-white rounded p-4 border border-red-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <FlagIcon className="w-5 h-5 text-red-500" />
                              <span className="font-medium text-gray-900">Flag {index + 1}</span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flag.status)}`}>
                                {flag.status}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(flag.reportedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Reason:</strong> {flag.reason}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Reported by:</strong> {flag.reportedBy}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {job.moderationNotes && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-sm text-yellow-800">
                          <strong>Moderation Notes:</strong> {job.moderationNotes}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center space-x-3">
                      <button
                        onClick={() => handleJobAction(job.id, 'approve')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Approve Job
                      </button>
                      <button
                        onClick={() => handleJobAction(job.id, 'reject')}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Reject Job
                      </button>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                ))}
                
                {jobs.filter(job => job.flags.length > 0).length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Flagged Jobs</h3>
                    <p className="text-gray-500">All jobs are currently clean and approved.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Categories Performance</h3>
                <div className="space-y-4">
                  {[
                    { department: 'Kitchen', jobs: 15, applications: 245, avgSalary: 35000 },
                    { department: 'Service', jobs: 28, applications: 423, avgSalary: 22000 },
                    { department: 'Management', jobs: 8, applications: 156, avgSalary: 55000 },
                    { department: 'Delivery', jobs: 12, applications: 289, avgSalary: 18000 }
                  ].map((category, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{category.department}</h4>
                        <span className="text-sm text-gray-500">{category.jobs} jobs</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Applications:</span>
                          <p className="font-medium">{category.applications}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Salary:</span>
                          <p className="font-medium">{formatCurrency(category.avgSalary)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Companies</h3>
                <div className="space-y-4">
                  {jobs
                    .filter(j => j.applications > 0)
                    .sort((a, b) => b.applications - a.applications)
                    .slice(0, 5)
                    .map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                            <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{job.company}</p>
                            <p className="text-sm text-gray-500">{job.applications} applications</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">⭐ {job.companyRating.toFixed(1)}</p>
                          <p className="text-sm text-gray-500">Trust: {job.companyTrustScore}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h3>
                <p className="text-gray-600">{selectedJob.company} • {selectedJob.location}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Job Description</h4>
                  <p className="text-gray-700">{selectedJob.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} className="text-gray-700">{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Benefits</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedJob.benefits.map((benefit, index) => (
                      <li key={index} className="text-gray-700">{benefit}</li>
                    ))}
                  </ul>
                </div>
                
                {selectedJob.flags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Flags</h4>
                    <div className="space-y-3">
                      {selectedJob.flags.map((flag, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-red-800 font-medium">{flag.reason}</p>
                          <p className="text-red-600 text-sm">
                            Reported by {flag.reportedBy} on {new Date(flag.reportedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Job Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{selectedJob.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium">{selectedJob.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedJob.employmentType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium">{selectedJob.experienceMin}+ years</span>
                    </div>
                    {selectedJob.salaryMin && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salary:</span>
                        <span className="font-medium">
                          {selectedJob.salaryMax 
                            ? `${formatCurrency(selectedJob.salaryMin)} - ${formatCurrency(selectedJob.salaryMax)}`
                            : `From ${formatCurrency(selectedJob.salaryMin)}`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Applications:</span>
                      <span className="font-medium">{selectedJob.applications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Views:</span>
                      <span className="font-medium">{selectedJob.views}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posted:</span>
                      <span className="font-medium">{new Date(selectedJob.postedAt).toLocaleDateString()}</span>
                    </div>
                    {selectedJob.expiresAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium">{new Date(selectedJob.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {selectedJob.status === 'under_review' || selectedJob.status === 'flagged' ? (
                    <>
                      <button
                        onClick={() => {
                          handleJobAction(selectedJob.id, 'approve')
                          setSelectedJob(null)
                        }}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Approve Job
                      </button>
                      <button
                        onClick={() => {
                          handleJobAction(selectedJob.id, 'reject')
                          setSelectedJob(null)
                        }}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Reject Job
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleJobAction(selectedJob.id, 'flag')
                        setSelectedJob(null)
                      }}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                    >
                      Flag for Review
                    </button>
                  )}
                  
                  {selectedJob.status === 'open' && (
                    <button
                      onClick={() => {
                        handleJobAction(selectedJob.id, selectedJob.isFeatured ? 'unfeature' : 'feature')
                        setSelectedJob(null)
                      }}
                      className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      {selectedJob.isFeatured ? 'Remove from Featured' : 'Make Featured'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}