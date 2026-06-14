'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Filter, Bookmark, Bell, Clock, DollarSign, MapPinIcon, Users, Building, Star } from 'lucide-react'

// Mock job data
const mockJobs = [
  {
    id: 1,
    title: 'Head Chef',
    company: 'The Grand Hotel',
    location: 'Mumbai, Maharashtra',
    type: 'Full-time',
    salary: '₹8-12 LPA',
    experience: '5-8 years',
    postedDate: '2 days ago',
    description: 'Looking for an experienced Head Chef to lead our kitchen team...',
    skills: ['Culinary Arts', 'Team Leadership', 'Menu Planning'],
    logo: '/api/placeholder/60/60',
    isUrgent: false,
    companyRating: 4.2,
    employeeCount: '50-100'
  },
  {
    id: 2,
    title: 'Restaurant Manager',
    company: 'Spice Route Restaurants',
    location: 'Delhi, India',
    type: 'Full-time',
    salary: '₹6-10 LPA',
    experience: '3-5 years',
    postedDate: '1 week ago',
    description: 'Seeking a dynamic Restaurant Manager to oversee daily operations...',
    skills: ['Restaurant Management', 'Customer Service', 'Staff Management'],
    logo: '/api/placeholder/60/60',
    isUrgent: true,
    companyRating: 4.5,
    employeeCount: '100-500'
  },
  {
    id: 3,
    title: 'Sous Chef',
    company: 'Coastal Kitchen',
    location: 'Goa, India',
    type: 'Full-time',
    salary: '₹4-6 LPA',
    experience: '2-4 years',
    postedDate: '3 days ago',
    description: 'Join our team as Sous Chef and work with fresh seafood...',
    skills: ['Cooking', 'Food Safety', 'Kitchen Operations'],
    logo: '/api/placeholder/60/60',
    isUrgent: false,
    companyRating: 4.0,
    employeeCount: '10-50'
  },
  {
    id: 4,
    title: 'Bartender',
    company: 'Urban Lounge',
    location: 'Bangalore, Karnataka',
    type: 'Part-time',
    salary: '₹2-4 LPA',
    experience: '1-3 years',
    postedDate: '5 days ago',
    description: 'Creative bartender needed for our upscale lounge...',
    skills: ['Mixology', 'Customer Service', 'Inventory Management'],
    logo: '/api/placeholder/60/60',
    isUrgent: false,
    companyRating: 4.3,
    employeeCount: '10-50'
  },
  {
    id: 5,
    title: 'Food Service Manager',
    company: 'Quick Bites Chain',
    location: 'Pune, Maharashtra',
    type: 'Full-time',
    salary: '₹5-8 LPA',
    experience: '4-6 years',
    postedDate: '1 day ago',
    description: 'Manage multiple food service locations...',
    skills: ['Operations Management', 'Quality Control', 'Staff Training'],
    logo: '/api/placeholder/60/60',
    isUrgent: true,
    companyRating: 3.9,
    employeeCount: '500+'
  }
]

export default function JobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState(mockJobs)
  const [filteredJobs, setFilteredJobs] = useState(mockJobs)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [savedJobs, setSavedJobs] = useState(new Set())

  const [filters, setFilters] = useState({
    jobType: [],
    experience: '',
    salary: '',
    datePosted: 'Any time'
  })

  useEffect(() => {
    let filtered = jobs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Location filter
    if (locationQuery) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationQuery.toLowerCase())
      )
    }

    // Job type filter
    if (filters.jobType.length > 0) {
      filtered = filtered.filter(job =>
        filters.jobType.includes(job.type)
      )
    }

    setFilteredJobs(filtered)
  }, [searchQuery, locationQuery, filters, jobs])

  const toggleSaveJob = (jobId) => {
    const newSaved = new Set(savedJobs)
    if (newSaved.has(jobId)) {
      newSaved.delete(jobId)
    } else {
      newSaved.add(jobId)
    }
    setSavedJobs(newSaved)
  }

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship']
  const experienceLevels = ['0-1 years', '1-3 years', '3-5 years', '5+ years']
  const salaryRanges = ['₹0-3 LPA', '₹3-6 LPA', '₹6-10 LPA', '₹10+ LPA']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
              <nav className="flex space-x-8">
                <button className="text-blue-600 border-b-2 border-blue-600 pb-2 font-semibold">
                  All Jobs
                </button>
                <button 
                  onClick={() => router.push('/jobs/saved')}
                  className="text-gray-600 hover:text-gray-900 pb-2"
                >
                  Saved Jobs
                </button>
                <button 
                  onClick={() => router.push('/jobs/applications')}
                  className="text-gray-600 hover:text-gray-900 pb-2"
                >
                  Applications
                </button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/jobs/saved')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <Bookmark className="w-5 h-5" />
                Saved ({savedJobs.size})
              </button>
              <button
                onClick={() => router.push('/jobs/alerts')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                Alerts
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search job titles, skills, or companies"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Search
            </button>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <span className="text-sm text-gray-600">
                {filteredJobs.length} jobs found
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Job Type */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Job Type</h3>
                <div className="space-y-2">
                  {jobTypes.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.jobType.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({...filters, jobType: [...filters.jobType, type]})
                          } else {
                            setFilters({...filters, jobType: filters.jobType.filter(t => t !== type)})
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 mr-2"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
                <select
                  value={filters.experience}
                  onChange={(e) => setFilters({...filters, experience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Any experience</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* Salary */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Salary Range</h3>
                <select
                  value={filters.salary}
                  onChange={(e) => setFilters({...filters, salary: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Any salary</option>
                  {salaryRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              {/* Date Posted */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Date Posted</h3>
                <select
                  value={filters.datePosted}
                  onChange={(e) => setFilters({...filters, datePosted: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Any time">Any time</option>
                  <option value="Last 24 hours">Last 24 hours</option>
                  <option value="Last week">Last week</option>
                  <option value="Last month">Last month</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <img
                        src={job.logo}
                        alt={job.company}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {job.title}
                              {job.isUrgent && (
                                <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                                  Urgent
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-600 mb-2">{job.company}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {job.salary}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {job.experience}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400" />
                                {job.companyRating}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {job.employeeCount} employees
                              </div>
                              <span className="text-gray-400">•</span>
                              <span>{job.postedDate}</span>
                            </div>
                            <p className="text-gray-700 mb-3 line-clamp-2">
                              {job.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {job.skills.slice(0, 3).map((skill, index) => (
                                <span
                                  key={index}
                                  className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSaveJob(job.id)
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        savedJobs.has(job.id)
                          ? 'text-blue-600 bg-blue-100'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Bookmark className="w-5 h-5" fill={savedJobs.has(job.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
                      {job.type}
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/jobs/${job.id}`)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Apply logic here
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setLocationQuery('')
                    setFilters({
                      jobType: [],
                      experience: '',
                      salary: '',
                      datePosted: 'Any time'
                    })
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/jobs/create')}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Post a Job
                </button>
                <button
                  onClick={() => router.push('/jobs/alerts')}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Create Job Alert
                </button>
                <button
                  onClick={() => router.push('/jobs/resume')}
                  className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Upload Resume
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Market Insights</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Average Salary</p>
                  <p className="text-lg font-semibold text-gray-900">₹6.2 LPA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Active Jobs</p>
                  <p className="text-lg font-semibold text-gray-900">{jobs.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Companies Hiring</p>
                  <p className="text-lg font-semibold text-gray-900">156</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}