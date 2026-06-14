'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  PlusIcon, 
  XMarkIcon, 
  MapPinIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  UserGroupIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  CalendarIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface JobFormData {
  id: string
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
  status: 'active' | 'paused' | 'closed'
  applicationsCount: number
}

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [formData, setFormData] = useState<JobFormData>({
    id: '',
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
    benefits_list: [''],
    status: 'active',
    applicationsCount: 0
  })

  const categories = [
    'Kitchen Staff', 'Front of House', 'Management', 'Delivery', 'Cleaning', 'Bartender'
  ]

  useEffect(() => {
    // Simulate loading existing job data
    const loadJobData = async () => {
      setIsLoading(true)
      
      // Mock data - replace with actual API call
      const mockJobData: JobFormData = {
        id: jobId,
        title: 'Senior Sous Chef',
        description: 'We are looking for an experienced sous chef to join our growing team at our downtown location. The ideal candidate will have leadership experience and be passionate about creating exceptional dining experiences.',
        requirements: [
          '3+ years of experience in a professional kitchen',
          'Culinary degree or equivalent experience',
          'Strong leadership and communication skills',
          'Food safety certification required'
        ],
        benefits: ['Health insurance', 'Paid time off', 'Staff meals', 'Career growth opportunities'],
        location: {
          type: 'onsite',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY'
        },
        salary: {
          min: 55000,
          max: 65000,
          period: 'yearly',
          negotiable: true
        },
        jobType: 'full-time',
        experienceLevel: 'mid',
        category: 'Kitchen Staff',
        skills: ['Culinary Arts', 'Leadership', 'Food Safety', 'Menu Planning'],
        applicationDeadline: '2024-02-15',
        startDate: '2024-03-01',
        positions: 1,
        urgentHiring: false,
        benefits_list: ['Health insurance', 'Paid time off', 'Staff meals', 'Career growth opportunities'],
        status: 'active',
        applicationsCount: 12
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      setFormData(mockJobData)
      setIsLoading(false)
    }

    loadJobData()
  }, [jobId])

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
    
    logger.info('Updated job data:', formData)
    
    setIsSubmitting(false)
    router.push('/dashboard/restaurant/jobs')
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    logger.info('Deleting job:', jobId)
    
    setIsSubmitting(false)
    router.push('/dashboard/restaurant/jobs')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>
            <p className="text-gray-600 mt-2">Update your job details and requirements</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                formData.status === 'active' ? 'bg-green-100 text-green-800' :
                formData.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {formData.status.toUpperCase()}
              </span>
              <span className="ml-3">{formData.applicationsCount} applications received</span>
            </div>
          </div>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete Job
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Job Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status</h3>
            <div className="flex space-x-4">
              {[
                { value: 'active', label: 'Active', color: 'green' },
                { value: 'paused', label: 'Paused', color: 'yellow' },
                { value: 'closed', label: 'Closed', color: 'gray' }
              ].map(({ value, label, color }) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value={value}
                    checked={formData.status === value}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as JobFormData['status'] }))}
                    className={`border-gray-300 text-${color}-600 focus:ring-${color}-500`}
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
              Job Details
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Requirements & Skills */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
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

          {/* Salary & Location */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
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

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard/restaurant/jobs')}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Job'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Job Posting</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this job posting? This action cannot be undone and will remove all associated applications.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Job'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}