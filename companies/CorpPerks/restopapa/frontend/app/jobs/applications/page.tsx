'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentIcon,
  BriefcaseIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface JobApplication {
  id: number
  applicant: {
    name: string
    email: string
    phone: string
    avatar: string
    experience: string
    rating: number
    verified: boolean
    location: string
  }
  job: {
    id: number
    title: string
    department: string
    location: string
  }
  appliedDate: string
  status: 'pending' | 'reviewed' | 'interviewed' | 'offered' | 'hired' | 'rejected'
  resume: string
  coverLetter: string
  salary: {
    expected: number
    negotiable: boolean
  }
  availability: {
    startDate: string
    schedule: string[]
  }
  skills: string[]
  certifications: string[]
  previousExperience: {
    restaurant: string
    role: string
    duration: string
  }[]
}

const mockApplications: JobApplication[] = [
  {
    id: 1,
    applicant: {
      name: 'Maria Rodriguez',
      email: 'maria.rodriguez@email.com',
      phone: '(555) 123-4567',
      avatar: '👩‍🍳',
      experience: '8+ years',
      rating: 4.9,
      verified: true,
      location: 'San Francisco, CA'
    },
    job: {
      id: 101,
      title: 'Head Chef',
      department: 'Kitchen',
      location: 'Downtown Location'
    },
    appliedDate: '2024-03-15T10:30:00Z',
    status: 'reviewed',
    resume: 'maria_rodriguez_resume.pdf',
    coverLetter: 'Passionate chef with 8+ years of experience specializing in Italian cuisine...',
    salary: {
      expected: 75000,
      negotiable: true
    },
    availability: {
      startDate: '2024-04-01',
      schedule: ['Full-time', 'Weekends', 'Evenings']
    },
    skills: ['Italian Cuisine', 'Menu Planning', 'Team Leadership', 'Cost Control'],
    certifications: ['ServSafe Manager', 'Culinary Arts Degree'],
    previousExperience: [
      { restaurant: 'Bella Vista', role: 'Sous Chef', duration: '3 years' },
      { restaurant: 'Romano\'s Kitchen', role: 'Line Cook', duration: '2 years' }
    ]
  },
  {
    id: 2,
    applicant: {
      name: 'James Thompson',
      email: 'james.thompson@email.com',
      phone: '(555) 234-5678',
      avatar: '👨‍🍳',
      experience: '5+ years',
      rating: 4.7,
      verified: true,
      location: 'Oakland, CA'
    },
    job: {
      id: 101,
      title: 'Head Chef',
      department: 'Kitchen',
      location: 'Downtown Location'
    },
    appliedDate: '2024-03-14T14:15:00Z',
    status: 'interviewed',
    resume: 'james_thompson_resume.pdf',
    coverLetter: 'Creative chef with expertise in French techniques and modern culinary innovations...',
    salary: {
      expected: 70000,
      negotiable: true
    },
    availability: {
      startDate: '2024-03-25',
      schedule: ['Full-time', 'Flexible']
    },
    skills: ['French Cuisine', 'Pastry Arts', 'Innovation', 'Sauce Making'],
    certifications: ['Le Cordon Bleu', 'HACCP Certified'],
    previousExperience: [
      { restaurant: 'Le Petit Bistro', role: 'Sous Chef', duration: '4 years' },
      { restaurant: 'Artisan Kitchen', role: 'Pastry Chef', duration: '1 year' }
    ]
  },
  {
    id: 3,
    applicant: {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '(555) 345-6789',
      avatar: '👩‍💼',
      experience: '4+ years',
      rating: 4.8,
      verified: true,
      location: 'San Francisco, CA'
    },
    job: {
      id: 102,
      title: 'Server',
      department: 'Front of House',
      location: 'Downtown Location'
    },
    appliedDate: '2024-03-13T16:45:00Z',
    status: 'offered',
    resume: 'sarah_chen_resume.pdf',
    coverLetter: 'Professional server with extensive experience in upscale dining establishments...',
    salary: {
      expected: 25,
      negotiable: false
    },
    availability: {
      startDate: '2024-03-20',
      schedule: ['Part-time', 'Evenings', 'Weekends']
    },
    skills: ['Wine Knowledge', 'POS Systems', 'Customer Service', 'Conflict Resolution'],
    certifications: ['Sommelier Level 1', 'Food Handler\'s License'],
    previousExperience: [
      { restaurant: 'The Metropolitan', role: 'Server', duration: '3 years' },
      { restaurant: 'Fine Dining Co', role: 'Host', duration: '1 year' }
    ]
  },
  {
    id: 4,
    applicant: {
      name: 'Alex Martinez',
      email: 'alex.martinez@email.com',
      phone: '(555) 456-7890',
      avatar: '🍸',
      experience: '6+ years',
      rating: 4.6,
      verified: false,
      location: 'San Jose, CA'
    },
    job: {
      id: 103,
      title: 'Bartender',
      department: 'Bar',
      location: 'Downtown Location'
    },
    appliedDate: '2024-03-12T11:20:00Z',
    status: 'pending',
    resume: 'alex_martinez_resume.pdf',
    coverLetter: 'Expert mixologist specializing in craft cocktails and bar operations management...',
    salary: {
      expected: 22,
      negotiable: true
    },
    availability: {
      startDate: '2024-04-15',
      schedule: ['Full-time', 'Nights', 'Weekends']
    },
    skills: ['Mixology', 'Inventory Management', 'Customer Service', 'Cost Control'],
    certifications: ['TABC Certified', 'Responsible Beverage Service'],
    previousExperience: [
      { restaurant: 'Cocktail Lounge', role: 'Head Bartender', duration: '4 years' },
      { restaurant: 'Sports Bar & Grill', role: 'Bartender', duration: '2 years' }
    ]
  }
]

export default function JobApplications() {
  const router = useRouter()
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [jobFilter, setJobFilter] = useState<string>('all')
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.job.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesJob = jobFilter === 'all' || app.job.id.toString() === jobFilter

    return matchesSearch && matchesStatus && matchesJob
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100'
      case 'reviewed': return 'text-blue-700 bg-blue-100'
      case 'interviewed': return 'text-purple-700 bg-purple-100'
      case 'offered': return 'text-green-700 bg-green-100'
      case 'hired': return 'text-green-700 bg-green-200'
      case 'rejected': return 'text-red-700 bg-red-100'
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
      default: return ClockIcon
    }
  }

  const updateApplicationStatus = (applicationId: number, newStatus: string) => {
    setApplications(apps =>
      apps.map(app =>
        app.id === applicationId ? { ...app, status: newStatus as any } : app
      )
    )
  }

  const uniqueJobs = Array.from(new Set(applications.map(app => app.job.id)))
    .map(id => applications.find(app => app.job.id === id)?.job)
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
              <p className="text-gray-600 mt-2">Review and manage applications for your job postings</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {filteredApplications.length} of {applications.length} applications
              </div>
              <button 
                onClick={() => router.push('/jobs/create')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Post New Job
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
                  placeholder="Search applicants or jobs..."
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
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Jobs</option>
                {uniqueJobs.map(job => (
                  <option key={job?.id} value={job?.id}>{job?.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Application Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {['pending', 'reviewed', 'interviewed', 'offered', 'hired', 'rejected'].map(status => (
            <div key={status} className="bg-white rounded-lg shadow-sm p-4 text-center">
              <div className={`text-2xl font-bold ${getStatusColor(status).split(' ')[0]}`}>
                {applications.filter(app => app.status === status).length}
              </div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </div>
          ))}
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {filteredApplications.map((application) => {
            const StatusIcon = getStatusIcon(application.status)
            
            return (
              <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl mr-4">
                        {application.applicant.avatar}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-semibold text-gray-900">{application.applicant.name}</h3>
                          {application.applicant.verified && (
                            <ShieldCheckIcon className="w-4 h-4 text-blue-500 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-blue-600 font-medium">Applied for {application.job.title}</p>
                        <p className="text-sm text-gray-600">{application.applicant.experience} • {application.applicant.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${getStatusColor(application.status)}`}>
                        {application.status}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Applied {new Date(application.appliedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Applicant Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Contact & Rating</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                          {application.applicant.email}
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                          {application.applicant.phone}
                        </div>
                        <div className="flex items-center">
                          <StarIcon className="w-4 h-4 text-yellow-400 mr-2" />
                          {application.applicant.rating}/5.0 rating
                        </div>
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                          {application.applicant.location}
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Application Details</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Expected Salary:</strong> ${application.salary.expected.toLocaleString()}{application.salary.expected < 100 ? '/hour' : '/year'}</p>
                        <p><strong>Available:</strong> {application.availability.startDate}</p>
                        <p><strong>Schedule:</strong> {application.availability.schedule.join(', ')}</p>
                        <div>
                          <strong>Top Skills:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {application.skills.slice(0, 3).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedApplication(application)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Full Profile
                        </button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'reviewed')}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                <EyeIcon className="w-3 h-3" />
                                Review
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                <XCircleIcon className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {application.status === 'reviewed' && (
                            <>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'interviewed')}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                              >
                                <ChatBubbleLeftRightIcon className="w-3 h-3" />
                                Interview
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                <XCircleIcon className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {application.status === 'interviewed' && (
                            <>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'offered')}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                <CheckCircleIcon className="w-3 h-3" />
                                Offer
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                className="flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                <XCircleIcon className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {application.status === 'offered' && (
                            <button
                              onClick={() => updateApplicationStatus(application.id, 'hired')}
                              className="col-span-2 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              <UserIcon className="w-3 h-3" />
                              Mark as Hired
                            </button>
                          )}
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded text-sm hover:bg-blue-50">
                          <EnvelopeIcon className="w-4 h-4" />
                          Send Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* No Results */}
        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <BriefcaseIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500 mb-4">
              {applications.length === 0 
                ? "You haven't received any job applications yet." 
                : "Try adjusting your search criteria or filters."
              }
            </p>
            {applications.length === 0 ? (
              <button
                onClick={() => router.push('/jobs/create')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Post Your First Job
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setJobFilter('all')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Application Details Modal - would be implemented with proper modal component */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal content would go here */}
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Full Application Details</h2>
              <p>Detailed view for {selectedApplication.applicant.name} would be implemented here</p>
              <button
                onClick={() => setSelectedApplication(null)}
                className="mt-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}