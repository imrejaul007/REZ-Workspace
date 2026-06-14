'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  HeartIcon,
  EyeIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  StarIcon,
  ShareIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'

interface SavedJob {
  id: number
  savedDate: string
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
    benefits: string[]
    postedDate: string
    applicants: number
    status: 'active' | 'paused' | 'closed'
  }
  restaurant: {
    id: number
    name: string
    logo: string
    rating: number
    location: string
    verified: boolean
    hiring: boolean
  }
  matchScore: number
  tags: string[]
  notes: string
  applied: boolean
}

const mockSavedJobs: SavedJob[] = [
  {
    id: 1,
    savedDate: '2024-03-15T10:30:00Z',
    job: {
      id: 201,
      title: 'Executive Chef',
      department: 'Kitchen',
      type: 'full-time',
      salary: { min: 85000, max: 110000, period: 'year' },
      location: 'Financial District',
      description: 'Lead our culinary team in creating innovative fine dining experiences...',
      requirements: ['10+ years culinary experience', 'Fine dining background', 'Leadership skills'],
      benefits: ['Health insurance', 'Paid time off', 'Professional development'],
      postedDate: '2024-03-10T09:00:00Z',
      applicants: 47,
      status: 'active'
    },
    restaurant: {
      id: 301,
      name: 'Michelin Star Restaurant',
      logo: '⭐',
      rating: 4.9,
      location: 'San Francisco, CA',
      verified: true,
      hiring: true
    },
    matchScore: 92,
    tags: ['High Salary', 'Fine Dining', 'Leadership'],
    notes: 'Dream job - perfect match for my experience',
    applied: false
  },
  {
    id: 2,
    savedDate: '2024-03-14T14:20:00Z',
    job: {
      id: 202,
      title: 'Pastry Chef',
      department: 'Kitchen',
      type: 'full-time',
      salary: { min: 28, max: 35, period: 'hour' },
      location: 'Mission District',
      description: 'Create beautiful desserts and artisanal pastries...',
      requirements: ['Culinary school certification', 'Pastry experience', 'Creative portfolio'],
      benefits: ['Flexible schedule', 'Creative freedom', 'Staff meals'],
      postedDate: '2024-03-08T11:15:00Z',
      applicants: 23,
      status: 'active'
    },
    restaurant: {
      id: 302,
      name: 'Artisan Bakery & Café',
      logo: '🧁',
      rating: 4.7,
      location: 'San Francisco, CA',
      verified: true,
      hiring: true
    },
    matchScore: 88,
    tags: ['Pastry', 'Creative', 'Flexible'],
    notes: 'Love their pastry style, good work-life balance',
    applied: true
  },
  {
    id: 3,
    savedDate: '2024-03-12T16:45:00Z',
    job: {
      id: 203,
      title: 'Restaurant Manager',
      department: 'Management',
      type: 'full-time',
      salary: { min: 65000, max: 75000, period: 'year' },
      location: 'Union Square',
      description: 'Oversee daily restaurant operations and staff management...',
      requirements: ['5+ years management experience', 'P&L responsibility', 'Staff development'],
      benefits: ['Management bonus', 'Health insurance', 'Career growth'],
      postedDate: '2024-03-05T13:30:00Z',
      applicants: 31,
      status: 'active'
    },
    restaurant: {
      id: 303,
      name: 'Modern American Bistro',
      logo: '🍽️',
      rating: 4.6,
      location: 'San Francisco, CA',
      verified: true,
      hiring: false
    },
    matchScore: 85,
    tags: ['Management', 'Leadership', 'Growth'],
    notes: 'Interesting opportunity to move into management',
    applied: false
  },
  {
    id: 4,
    savedDate: '2024-03-10T11:20:00Z',
    job: {
      id: 204,
      title: 'Sommelier',
      department: 'Front of House',
      type: 'part-time',
      salary: { min: 30, max: 40, period: 'hour' },
      location: 'Nob Hill',
      description: 'Curate wine selections and provide expert wine service...',
      requirements: ['Sommelier certification', 'Wine knowledge', 'Customer service'],
      benefits: ['Wine education', 'Flexible hours', 'Networking'],
      postedDate: '2024-03-01T10:00:00Z',
      applicants: 15,
      status: 'paused'
    },
    restaurant: {
      id: 304,
      name: 'Wine & Dine',
      logo: '🍷',
      rating: 4.8,
      location: 'San Francisco, CA',
      verified: true,
      hiring: false
    },
    matchScore: 79,
    tags: ['Wine', 'Part-time', 'Specialized'],
    notes: 'Perfect part-time opportunity, currently on hold',
    applied: false
  }
]

export default function SavedJobs() {
  const router = useRouter()
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(mockSavedJobs)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set())

  const filteredJobs = savedJobs.filter(job => {
    const matchesSearch = job.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === 'all' || job.job.type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'applied' && job.applied) ||
                         (statusFilter === 'not-applied' && !job.applied) ||
                         (statusFilter === 'active' && job.job.status === 'active') ||
                         (statusFilter === 'closed' && job.job.status === 'closed')

    return matchesSearch && matchesType && matchesStatus
  })

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime()
      case 'match':
        return b.matchScore - a.matchScore
      case 'salary':
        const aSalary = a.job.salary.period === 'hour' ? a.job.salary.max * 2080 : a.job.salary.max
        const bSalary = b.job.salary.period === 'hour' ? b.job.salary.max * 2080 : b.job.salary.max
        return bSalary - aSalary
      case 'posted':
        return new Date(b.job.postedDate).getTime() - new Date(a.job.postedDate).getTime()
      default:
        return 0
    }
  })

  const removeSavedJob = (jobId: number) => {
    if (confirm('Are you sure you want to remove this job from your saved list?')) {
      setSavedJobs(jobs => jobs.filter(job => job.id !== jobId))
    }
  }

  const toggleJobSelection = (jobId: number) => {
    setSelectedJobs(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(jobId)) {
        newSelected.delete(jobId)
      } else {
        newSelected.add(jobId)
      }
      return newSelected
    })
  }

  const removeSelectedJobs = () => {
    if (selectedJobs.size > 0 && confirm(`Remove ${selectedJobs.size} selected jobs from your saved list?`)) {
      setSavedJobs(jobs => jobs.filter(job => !selectedJobs.has(job.id)))
      setSelectedJobs(new Set())
    }
  }

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 bg-green-100'
      case 'paused': return 'text-yellow-700 bg-yellow-100'
      case 'closed': return 'text-red-700 bg-red-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <HeartSolid className="w-8 h-8 text-red-500 mr-3" />
                Saved Jobs
              </h1>
              <p className="text-gray-600 mt-2">Jobs you've bookmarked for later review</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {filteredJobs.length} of {savedJobs.length} saved jobs
              </div>
              <button 
                onClick={() => router.push('/jobs')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse More Jobs
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search saved jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="not-applied">Not Applied</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Recently Saved</option>
                <option value="match">Best Match</option>
                <option value="salary">Highest Salary</option>
                <option value="posted">Recently Posted</option>
              </select>
            </div>
          </div>

          {selectedJobs.size > 0 && (
            <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg p-3">
              <span className="text-blue-800 font-medium">
                {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedJobs(new Set())}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={removeSelectedJobs}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  <TrashIcon className="w-3 h-3" />
                  Remove Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {savedJobs.length}
            </div>
            <div className="text-sm text-gray-600">Total Saved</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {savedJobs.filter(job => job.applied).length}
            </div>
            <div className="text-sm text-gray-600">Applied</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {savedJobs.filter(job => job.job.status === 'active' && !job.applied).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(savedJobs.reduce((sum, job) => sum + job.matchScore, 0) / savedJobs.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Match</div>
          </div>
        </div>

        {/* Saved Jobs List */}
        <div className="space-y-6">
          {sortedJobs.map((savedJob) => (
            <div key={savedJob.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedJobs.has(savedJob.id)}
                      onChange={() => toggleJobSelection(savedJob.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                    />
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl mr-4">
                      {savedJob.restaurant.logo}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{savedJob.job.title}</h3>
                      <p className="text-blue-600 font-medium">{savedJob.restaurant.name}</p>
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {savedJob.job.location}
                        {savedJob.restaurant.verified && (
                          <span className="ml-2 text-green-600">✓ Verified</span>
                        )}
                        {savedJob.applied && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Applied
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 text-sm font-medium rounded-full ${getMatchScoreColor(savedJob.matchScore)}`}>
                      {savedJob.matchScore}% Match
                    </div>
                    <div className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${getJobStatusColor(savedJob.job.status)}`}>
                      {savedJob.job.status}
                    </div>
                    <button
                      onClick={() => removeSavedJob(savedJob.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Job Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Job Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <BriefcaseIcon className="w-4 h-4 mr-2" />
                        <span className="capitalize">{savedJob.job.type}</span>
                      </div>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                        ${savedJob.job.salary.min.toLocaleString()} - ${savedJob.job.salary.max.toLocaleString()} 
                        /{savedJob.job.salary.period}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Posted {new Date(savedJob.job.postedDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 mr-2" />
                        {savedJob.restaurant.rating}/5.0 • {savedJob.job.applicants} applicants
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {savedJob.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes & Timeline */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Your Notes</h4>
                    <div className="text-sm text-gray-600 mb-4">
                      {savedJob.notes || (
                        <span className="italic text-gray-400">No notes added</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Saved: {new Date(savedJob.savedDate).toLocaleDateString()}</div>
                      {savedJob.applied && <div className="text-green-600 font-medium">Applied to this position</div>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => router.push(`/jobs/${savedJob.job.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View Job Details
                      </button>
                      
                      {!savedJob.applied && savedJob.job.status === 'active' && (
                        <button
                          onClick={() => router.push(`/jobs/${savedJob.job.id}`)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <PlusIcon className="w-4 h-4" />
                          Apply Now
                        </button>
                      )}
                      
                      {savedJob.applied && (
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded text-sm cursor-default">
                          <CheckCircleIcon className="w-4 h-4" />
                          Application Submitted
                        </button>
                      )}

                      <button
                        onClick={() => router.push(`/profile/restaurant/${savedJob.restaurant.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50"
                      >
                        <BuildingStorefrontIcon className="w-4 h-4" />
                        View Restaurant
                      </button>

                      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                        <ShareIcon className="w-4 h-4" />
                        Share Job
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs found</h3>
            <p className="text-gray-500 mb-4">
              {savedJobs.length === 0 
                ? "You haven't saved any jobs yet. Start browsing to save jobs you're interested in!" 
                : "Try adjusting your search criteria or filters."
              }
            </p>
            {savedJobs.length === 0 ? (
              <button
                onClick={() => router.push('/jobs')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Browse Jobs
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setTypeFilter('all')
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