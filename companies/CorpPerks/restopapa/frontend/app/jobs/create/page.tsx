'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePosts } from '@/contexts/PostsContext'
import { useToast } from '@/components/ui/Toast'
import { 
  ArrowLeftIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const jobTypes = [
  { id: 'full-time', name: 'Full-time', description: 'Regular 40+ hours per week' },
  { id: 'part-time', name: 'Part-time', description: 'Less than 40 hours per week' },
  { id: 'contract', name: 'Contract', description: 'Fixed-term or project-based' },
  { id: 'internship', name: 'Internship', description: 'Training and learning opportunity' }
]

const experienceLevels = [
  { id: 'entry', name: 'Entry Level', description: '0-2 years experience' },
  { id: 'mid', name: 'Mid Level', description: '2-5 years experience' },
  { id: 'senior', name: 'Senior Level', description: '5+ years experience' },
  { id: 'executive', name: 'Executive', description: '10+ years with leadership experience' }
]

const jobCategories = [
  { id: 'kitchen', name: 'Kitchen Staff', icon: '👨‍🍳' },
  { id: 'service', name: 'Front of House', icon: '🍽️' },
  { id: 'management', name: 'Management', icon: '👔' },
  { id: 'delivery', name: 'Delivery', icon: '🚚' },
  { id: 'bartender', name: 'Bar Staff', icon: '🍸' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹' }
]

export default function CreateJob() {
  const router = useRouter()
  const { addPost } = usePosts()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form data
  const [jobData, setJobData] = useState({
    title: '',
    category: '',
    description: '',
    requirements: '',
    responsibilities: '',
    jobType: '',
    experienceLevel: '',
    location: '',
    salary: {
      min: '',
      max: '',
      currency: 'USD',
      period: 'yearly'
    },
    benefits: '',
    applicationDeadline: '',
    startDate: '',
    positions: '1',
    remoteFriendly: false,
    urgentHiring: false
  })

  const updateJobData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setJobData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }))
    } else {
      setJobData(prev => ({ ...prev, [field]: value }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!jobData.title.trim()) newErrors.title = 'Job title is required'
    if (!jobData.category) newErrors.category = 'Please select a category'
    if (!jobData.description.trim()) newErrors.description = 'Job description is required'
    if (!jobData.location.trim()) newErrors.location = 'Location is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!jobData.jobType) newErrors.jobType = 'Please select a job type'
    if (!jobData.experienceLevel) newErrors.experienceLevel = 'Please select experience level'
    if (!jobData.salary.min) newErrors.salaryMin = 'Minimum salary is required'
    if (!jobData.salary.max) newErrors.salaryMax = 'Maximum salary is required'
    
    if (jobData.salary.min && jobData.salary.max) {
      if (parseFloat(jobData.salary.min) >= parseFloat(jobData.salary.max)) {
        newErrors.salaryMax = 'Maximum salary must be higher than minimum'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return

    setIsSubmitting(true)
    
    try {
      // Simulate job posting API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Add job to unified community feed
      addPost({
        user: { 
          name: 'Current Restaurant', 
          avatar: '🏢', 
          type: 'Restaurant',
          verified: true,
          location: jobData.location || 'Location Not Specified'
        },
        content: `🔥 We're hiring! ${jobData.title} position available at our restaurant. ${jobData.description.substring(0, 150)}${jobData.description.length > 150 ? '...' : ''}`,
        images: [],
        time: 'Just now',
        likes: 0,
        comments: 0,
        shares: 0,
        isLiked: false,
        category: 'Job Posting',
        tags: ['hiring', jobData.category, jobData.type],
        postType: 'job',
        jobDetails: {
          title: jobData.title,
          salary: `$${jobData.salaryMin} - $${jobData.salaryMax}`,
          type: jobData.type.charAt(0).toUpperCase() + jobData.type.slice(1),
          experience: experienceLevels.find(level => level.id === jobData.experience)?.name || jobData.experience,
          location: jobData.location || 'Location Not Specified',
          description: jobData.requirements || jobData.description
        }
      })
      
      // Success - redirect to community page to show the post
      showToast({
        type: 'success',
        title: 'Job Posted!',
        message: 'Redirecting to community feed...'
      })
      setTimeout(() => router.push('/community'), 2000)
    } catch (error) {
      setErrors({ general: 'Failed to post job. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, name: 'Job Details', completed: currentStep > 1 },
    { id: 2, name: 'Requirements & Compensation', completed: currentStep > 2 },
    { id: 3, name: 'Review & Publish', completed: false }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard/restaurant?section=jobs')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === step.id
                    ? 'border-blue-500 text-blue-500'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Step 1: Job Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => updateJobData('title', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g. Senior Chef, Restaurant Manager, Server"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={jobData.category}
                    onChange={(e) => updateJobData('category', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a category</option>
                    {jobCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={jobData.location}
                      onChange={(e) => updateJobData('location', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.location ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="City, State"
                    />
                  </div>
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobData.description}
                  onChange={(e) => updateJobData('description', e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe the role, what the candidate will do, and what makes this opportunity unique..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Responsibilities
                </label>
                <textarea
                  value={jobData.responsibilities}
                  onChange={(e) => updateJobData('responsibilities', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="• Manage kitchen operations
• Train and supervise staff
• Ensure food quality and safety standards"
                />
              </div>

              <button
                onClick={() => {
                  if (validateStep1()) setCurrentStep(2)
                }}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue to Requirements
              </button>
            </div>
          )}

          {/* Step 2: Requirements & Compensation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Requirements & Compensation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Job Type *
                  </label>
                  <div className="space-y-3">
                    {jobTypes.map(type => (
                      <label key={type.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="jobType"
                          value={type.id}
                          checked={jobData.jobType === type.id}
                          onChange={(e) => updateJobData('jobType', e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{type.name}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.jobType && <p className="mt-1 text-sm text-red-600">{errors.jobType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Experience Level *
                  </label>
                  <div className="space-y-3">
                    {experienceLevels.map(level => (
                      <label key={level.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="experienceLevel"
                          value={level.id}
                          checked={jobData.experienceLevel === level.id}
                          onChange={(e) => updateJobData('experienceLevel', e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{level.name}</div>
                          <div className="text-sm text-gray-600">{level.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.experienceLevel && <p className="mt-1 text-sm text-red-600">{errors.experienceLevel}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={jobData.salary.min}
                      onChange={(e) => updateJobData('salary.min', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.salaryMin ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Min"
                    />
                  </div>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={jobData.salary.max}
                      onChange={(e) => updateJobData('salary.max', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.salaryMax ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Max"
                    />
                  </div>
                  <select
                    value={jobData.salary.currency}
                    onChange={(e) => updateJobData('salary.currency', e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <select
                    value={jobData.salary.period}
                    onChange={(e) => updateJobData('salary.period', e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="yearly">per year</option>
                    <option value="monthly">per month</option>
                    <option value="hourly">per hour</option>
                  </select>
                </div>
                {(errors.salaryMin || errors.salaryMax) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.salaryMin || errors.salaryMax}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  value={jobData.requirements}
                  onChange={(e) => updateJobData('requirements', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="• 3+ years experience in restaurant management
• Food safety certification required
• Strong leadership and communication skills"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benefits & Perks
                </label>
                <textarea
                  value={jobData.benefits}
                  onChange={(e) => updateJobData('benefits', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="• Health insurance
• Paid time off
• Employee meals
• Career development opportunities"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Positions
                  </label>
                  <div className="relative">
                    <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={jobData.positions}
                      onChange={(e) => updateJobData('positions', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Deadline
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={jobData.applicationDeadline}
                      onChange={(e) => updateJobData('applicationDeadline', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={jobData.startDate}
                      onChange={(e) => updateJobData('startDate', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={jobData.remoteFriendly}
                    onChange={(e) => updateJobData('remoteFriendly', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Remote-friendly position</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={jobData.urgentHiring}
                    onChange={(e) => updateJobData('urgentHiring', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Urgent hiring (will be marked as priority)</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Publishing Job...' : 'Publish Job'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}