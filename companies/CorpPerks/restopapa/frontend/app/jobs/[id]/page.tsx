'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  BookmarkIcon,
  ShareIcon,
  CheckCircleIcon,
  UserGroupIcon,
  EyeIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid'

// This would normally come from an API call using the job ID
const mockJobDetail = {
  id: '1',
  title: 'Head Chef',
  restaurant: {
    name: 'The French Bistro',
    logo: '/restaurant-logos/french-bistro.jpg',
    location: 'New York, NY',
    verified: true,
    employees: '51-200',
    about: 'Award-winning French restaurant serving authentic cuisine since 1995. We pride ourselves on using only the finest ingredients and traditional French cooking techniques. Our team is passionate about delivering exceptional dining experiences in an elegant atmosphere.',
    website: 'www.thefrenchbistro.com',
    phone: '(212) 555-0123',
    email: 'careers@thefrenchbistro.com',
    founded: '1995',
    industry: 'Fine Dining'
  },
  description: `We are seeking an experienced Head Chef to lead our kitchen team and maintain our high standards of French cuisine. This is an exceptional opportunity for a culinary professional who is passionate about French cooking and wants to lead a team in one of New York's most respected restaurants.

The successful candidate will be responsible for overseeing all kitchen operations, menu development, and maintaining our reputation for excellence. You will work closely with our management team to ensure consistent quality and manage food costs while fostering a positive work environment.`,
  requirements: [
    '10+ years of experience in fine dining restaurants',
    'Culinary degree from an accredited institution',
    'Extensive experience with French cuisine and techniques',
    'Proven leadership and team management skills',
    'Strong understanding of food safety and sanitation',
    'Experience with menu development and costing',
    'Ability to work in a fast-paced environment',
    'Excellent communication skills',
    'ServSafe certification required'
  ],
  responsibilities: [
    'Lead and manage kitchen staff of 15+ team members',
    'Develop seasonal menus featuring authentic French cuisine',
    'Ensure consistent food quality and presentation',
    'Manage inventory and control food costs',
    'Train and mentor junior kitchen staff',
    'Maintain health department standards',
    'Collaborate with front-of-house management',
    'Handle special dietary requests and modifications',
    'Oversee food preparation and cooking processes'
  ],
  location: 'Manhattan, NY',
  locationType: 'onsite',
  type: 'full-time',
  experience: 'Senior level',
  salary: {
    min: 85000,
    max: 120000,
    period: 'yearly'
  },
  benefits: [
    'Comprehensive health insurance (medical, dental, vision)',
    '401(k) retirement plan with company matching',
    'Paid time off and vacation days',
    'Professional development opportunities',
    'Employee meal program',
    'Uniform allowance',
    'Performance-based bonuses',
    'Career advancement opportunities'
  ],
  skills: ['French Cuisine', 'Menu Development', 'Team Leadership', 'Food Safety', 'Cost Control', 'Kitchen Management', 'Recipe Development', 'Staff Training'],
  postedDate: '2024-03-10',
  applicants: 45,
  views: 1250,
  isPromoted: true,
  isSaved: false,
  isEasyApply: true,
  matchScore: 92,
  urgentHiring: true,
  activelyRecruiting: true,
  applicationStatus: 'not-applied',
  companySize: '51-200 employees',
  workSchedule: 'Monday-Saturday, 10 AM - 11 PM',
  reportingTo: 'Executive Chef and Restaurant Owner',
  teamSize: '15-20 kitchen staff members'
}

const similarJobs = [
  {
    id: '2',
    title: 'Executive Sous Chef',
    restaurant: { name: 'Le Petit Coq', location: 'Brooklyn, NY' },
    salary: '$70k-90k',
    postedDate: '1 day ago'
  },
  {
    id: '3', 
    title: 'Kitchen Manager',
    restaurant: { name: 'Bistro Laurent', location: 'Manhattan, NY' },
    salary: '$75k-95k',
    postedDate: '3 days ago'
  },
  {
    id: '4',
    title: 'Head Chef',
    restaurant: { name: 'Chez Michel', location: 'Queens, NY' },
    salary: '$80k-110k',
    postedDate: '5 days ago'
  }
]

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [job] = useState(mockJobDetail)
  const [isSaved, setIsSaved] = useState(job.isSaved)
  const [activeTab, setActiveTab] = useState<'overview' | 'company' | 'similar'>('overview')

  const formatSalary = (salary: typeof job.salary) => {
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

  const handleApply = () => {
    if (job.isEasyApply) {
      router.push(`/jobs/${job.id}/apply?mode=easy`)
    } else {
      router.push(`/jobs/${job.id}/apply`)
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Job link copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600">{job.restaurant.name} • {job.location}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Job Header Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h2>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <span className="text-xl font-medium">{job.restaurant.name}</span>
                      {job.restaurant.verified && (
                        <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <BuildingOfficeIcon className="w-4 h-4" />
                        {job.restaurant.employees} employees
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {isSaved ? (
                      <BookmarkSolid className="w-5 h-5 text-blue-600" />
                    ) : (
                      <BookmarkIcon className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Job Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Salary</p>
                  <p className="font-semibold text-gray-900">{formatSalary(job.salary)}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <BriefcaseIcon className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{job.type.replace('-', ' ')}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <ClockIcon className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-semibold text-gray-900">{job.experience}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-sm text-gray-600">Applicants</p>
                  <p className="font-semibold text-gray-900">{job.applicants}</p>
                </div>
              </div>

              {/* Match Score */}
              {job.matchScore && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-green-600 font-semibold">
                        {job.matchScore}% match with your profile
                      </p>
                      <p className="text-sm text-green-700">
                        Your skills and experience align well with this role
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Section */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <h3 className="font-semibold text-blue-900">Ready to apply?</h3>
                  <p className="text-sm text-blue-700">
                    {job.isEasyApply ? 'Quick application with your profile' : 'Complete application required'}
                  </p>
                </div>
                <button
                  onClick={handleApply}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
                >
                  {job.isEasyApply && <SparklesIcon className="w-4 h-4" />}
                  {job.isEasyApply ? 'Easy Apply' : 'Apply Now'}
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Job Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('company')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 ${
                      activeTab === 'company'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    About Company
                  </button>
                  <button
                    onClick={() => setActiveTab('similar')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 ${
                      activeTab === 'similar'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Similar Jobs
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* Job Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Job Description */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">About this role</h3>
                      <div className="prose text-gray-600 whitespace-pre-line">
                        {job.description}
                      </div>
                    </div>

                    {/* Key Responsibilities */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Responsibilities</h3>
                      <ul className="space-y-3">
                        {job.responsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Requirements */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h3>
                      <ul className="space-y-3">
                        {job.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-600">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <span key={skill} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Benefits & Perks</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {job.benefits.map((benefit) => (
                          <div key={benefit} className="flex items-start gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Tab */}
                {activeTab === 'company' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">About {job.restaurant.name}</h3>
                      <p className="text-gray-600 mb-6">{job.restaurant.about}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Company Details</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-600">{job.restaurant.employees} employees</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-600">Founded in {job.restaurant.founded}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <StarIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-600">{job.restaurant.industry}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <MapPinIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-600">{job.restaurant.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                              <a href={`https://${job.restaurant.website}`} className="text-blue-600 hover:text-blue-700">
                                {job.restaurant.website}
                              </a>
                            </div>
                            <div className="flex items-center gap-3">
                              <PhoneIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-600">{job.restaurant.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-gray-600">{job.restaurant.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Similar Jobs Tab */}
                {activeTab === 'similar' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Similar Positions</h3>
                    {similarJobs.map((similarJob) => (
                      <div key={similarJob.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => router.push(`/jobs/${similarJob.id}`)}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 hover:text-blue-600">{similarJob.title}</h4>
                            <p className="text-gray-600">{similarJob.restaurant.name}</p>
                            <p className="text-sm text-gray-500">{similarJob.restaurant.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{similarJob.salary}</p>
                            <p className="text-sm text-gray-500">{similarJob.postedDate}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* Quick Apply Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Apply for this position</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Application type</span>
                    <span className="font-medium">{job.isEasyApply ? 'Easy Apply' : 'Full Application'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Response time</span>
                    <span className="font-medium">Within 3 days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Posted</span>
                    <span className="font-medium">{getDaysAgo(job.postedDate)}</span>
                  </div>
                </div>

                <button
                  onClick={handleApply}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                >
                  {job.isEasyApply && <SparklesIcon className="w-4 h-4" />}
                  {job.isEasyApply ? 'Easy Apply' : 'Apply Now'}
                </button>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <EyeIcon className="w-4 h-4" />
                    <span>{job.views} people viewed this job</span>
                  </div>
                </div>
              </div>

              {/* Job Insights */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Job Insights</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Schedule</p>
                      <p className="text-sm text-gray-600">{job.workSchedule}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <UserGroupIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Team Size</p>
                      <p className="text-sm text-gray-600">{job.teamSize}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <DocumentTextIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Reporting To</p>
                      <p className="text-sm text-gray-600">{job.reportingTo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hiring Status */}
              {(job.urgentHiring || job.activelyRecruiting) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Hiring Status</h3>
                  <div className="space-y-3">
                    {job.urgentHiring && (
                      <div className="flex items-center gap-3 text-sm">
                        <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-orange-700 font-medium">Urgent hiring</span>
                      </div>
                    )}
                    {job.activelyRecruiting && (
                      <div className="flex items-center gap-3 text-sm">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="text-green-700 font-medium">Actively recruiting</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}