'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  XMarkIcon, 
  MapPinIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  UserGroupIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  TagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface JobFormData {
  title: string
  description: string
  requirements: string[]
  benefits: string[]
  location: {
    type: 'remote' | 'hybrid' | 'onsite'
    address: string
    city: string
    state: string
  }
  salary: {
    min: number
    max: number
    period: 'hourly' | 'monthly' | 'yearly'
    negotiable: boolean
  }
  jobType: 'full-time' | 'part-time' | 'contract' | 'temporary'
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive'
  category: string
  skills: string[]
  applicationDeadline: string
  startDate: string
  positions: number
  urgentHiring: boolean
  benefits_list: string[]
}

export default function CreateJobPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: [''],
    benefits: [''],
    location: {
      type: 'onsite',
      address: '',
      city: '',
      state: ''
    },
    salary: {
      min: 0,
      max: 0,
      period: 'hourly',
      negotiable: false
    },
    jobType: 'full-time',
    experienceLevel: 'entry',
    category: '',
    skills: [''],
    applicationDeadline: '',
    startDate: '',
    positions: 1,
    urgentHiring: false,
    benefits_list: ['']
  })

  const categories = [
    'Kitchen Staff', 'Front of House', 'Management', 'Delivery', 'Cleaning', 'Bartender'
  ]

  const addArrayItem = (field: keyof Pick<JobFormData, 'requirements' | 'benefits' | 'skills' | 'benefits_list'>) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field: keyof Pick<JobFormData, 'requirements' | 'benefits' | 'skills' | 'benefits_list'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updateArrayItem = (field: keyof Pick<JobFormData, 'requirements' | 'benefits' | 'skills' | 'benefits_list'>, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Here you would typically send the data to your API
    logger.info('Job posting data:', formData)
    
    setIsSubmitting(false)
    router.push('/dashboard/restaurant/jobs')
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
          Job Details
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Head Chef, Server, Kitchen Assistant"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Positions
              </label>
              <input
                type="number"
                min="1"
                value={formData.positions}
                onChange={(e) => setFormData(prev => ({ ...prev, positions: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={6}
              placeholder="Describe the role, responsibilities, and what makes your restaurant a great place to work..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
          Requirements & Skills
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type *
              </label>
              <select
                value={formData.jobType}
                onChange={(e) => setFormData(prev => ({ ...prev, jobType: e.target.value as JobFormData['jobType'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level *
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as JobFormData['experienceLevel'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateArrayItem('requirements', index, e.target.value)}
                  placeholder="e.g. 2+ years experience in fast-paced kitchen"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('requirements', index)}
                    className="ml-2 p-1 text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('requirements')}
              className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Requirement
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            {formData.skills.map((skill, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={skill}
                  onChange={(e) => updateArrayItem('skills', index, e.target.value)}
                  placeholder="e.g. Food Safety Certification, POS Systems"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.skills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('skills', index)}
                    className="ml-2 p-1 text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('skills')}
              className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Skill
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CurrencyDollarIcon className="w-5 h-5 mr-2 text-blue-600" />
          Compensation & Location
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Salary Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Amount</label>
                <input
                  type="number"
                  value={formData.salary.min}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, min: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Amount</label>
                <input
                  type="number"
                  value={formData.salary.max}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, max: parseFloat(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Period</label>
                <select
                  value={formData.salary.period}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, period: e.target.value as JobFormData['salary']['period'] }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hourly">Per Hour</option>
                  <option value="monthly">Per Month</option>
                  <option value="yearly">Per Year</option>
                </select>
              </div>
            </div>
            <div className="mt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.salary.negotiable}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, negotiable: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Salary is negotiable</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Location
            </label>
            <div className="space-y-4">
              <div className="flex space-x-4">
                {[
                  { value: 'onsite', label: 'On-site', icon: BuildingOffice2Icon },
                  { value: 'remote', label: 'Remote', icon: MapPinIcon },
                  { value: 'hybrid', label: 'Hybrid', icon: ClockIcon }
                ].map(({ value, label, icon: Icon }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value={value}
                      checked={formData.location.type === value}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, type: e.target.value as JobFormData['location']['type'] }
                      }))}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Icon className="w-4 h-4 ml-2 mr-1 text-gray-500" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              {formData.location.type !== 'remote' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={formData.location.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, address: e.target.value }
                      }))}
                      placeholder="Street address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, city: e.target.value }
                      }))}
                      placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits
            </label>
            {formData.benefits_list.map((benefit, index) => (
              <div key={index} className="flex items-center mb-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => updateArrayItem('benefits_list', index, e.target.value)}
                  placeholder="e.g. Health Insurance, Flexible Schedule, Staff Meals"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.benefits_list.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('benefits_list', index)}
                    className="ml-2 p-1 text-red-600 hover:text-red-800"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('benefits_list')}
              className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Benefit
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
          Timeline & Settings
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => setFormData(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.urgentHiring}
                onChange={(e) => setFormData(prev => ({ ...prev, urgentHiring: e.target.checked }))}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Mark as urgent hiring</span>
              <span className="ml-2 text-xs text-gray-500">(Will be highlighted to applicants)</span>
            </label>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-4">Job Posting Preview</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Title:</strong> {formData.title || 'Job Title'}</div>
              <div><strong>Category:</strong> {formData.category || 'Category'}</div>
              <div><strong>Type:</strong> {formData.jobType} • {formData.experienceLevel}</div>
              <div><strong>Salary:</strong> {formData.salary.min && formData.salary.max ? 
                `$${formData.salary.min}-${formData.salary.max} ${formData.salary.period}` : 'Not specified'}</div>
              <div><strong>Location:</strong> {formData.location.type === 'remote' ? 'Remote' : 
                `${formData.location.city || 'Location'} (${formData.location.type})`}</div>
              <div><strong>Positions:</strong> {formData.positions}</div>
              {formData.urgentHiring && (
                <div className="text-red-600 font-medium">🔥 URGENT HIRING</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Job Posting</h1>
          <p className="text-gray-600 mt-2">Fill out the details below to post your job opportunity</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 md:w-32 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Details</span>
            <span>Requirements</span>
            <span>Compensation</span>
            <span>Timeline</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/restaurant/jobs')}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Publishing...
                    </>
                  ) : (
                    'Publish Job'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}