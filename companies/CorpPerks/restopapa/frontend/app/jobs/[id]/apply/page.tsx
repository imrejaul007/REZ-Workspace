'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  PaperClipIcon,
  DocumentTextIcon,
  UserIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const mockJobData = {
  id: '1',
  title: 'Head Chef',
  company: 'The Grand Hotel',
  location: 'Mumbai, Maharashtra',
  salary: '₹8-12 LPA',
  requirements: ['Culinary degree', '5+ years experience', 'Team leadership skills']
}

export default function JobApplication() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    coverLetter: '',
    experience: '',
    availability: '',
    expectedSalary: '',
    portfolio: null,
    resume: null,
    certificates: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const params = useParams()
  const router = useRouter()

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (field: string, file: File) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSubmitted(true)
    setIsSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your application for {mockJobData.title} at {mockJobData.company} has been submitted successfully. 
            You'll receive a confirmation email shortly.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/jobs/applications')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              View My Applications
            </button>
            <button
              onClick={() => router.push('/jobs')}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
            >
              Browse More Jobs
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">Apply for {mockJobData.title}</h1>
              <p className="text-gray-600">{mockJobData.company} • {mockJobData.location}</p>
            </div>

            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: 'Basic Info' },
              { step: 2, title: 'Experience' },
              { step: 3, title: 'Documents' },
              { step: 4, title: 'Review' }
            ].map((stepItem, index) => (
              <div key={stepItem.step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepItem.step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepItem.step}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">{stepItem.title}</span>
                {index < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > stepItem.step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about yourself</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why are you interested in this position? *
                </label>
                <textarea
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain why you're the perfect fit for this role, your relevant experience, and what excites you about this opportunity..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select experience</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-8">5-8 years</option>
                    <option value="8+">8+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability *
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select availability</option>
                    <option value="immediate">Immediate</option>
                    <option value="2weeks">2 weeks notice</option>
                    <option value="1month">1 month notice</option>
                    <option value="3months">3+ months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Salary Range
                </label>
                <input
                  type="text"
                  value={formData.expectedSalary}
                  onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ₹8-12 LPA"
                />
              </div>
            </div>
          )}

          {/* Step 2: Experience Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Experience</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-1 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Job Requirements</h4>
                    <ul className="text-sm text-blue-800 mt-1 space-y-1">
                      {mockJobData.requirements.map((req, index) => (
                        <li key={index}>• {req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your relevant experience *
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detail your relevant work experience, key achievements, and how you meet the job requirements..."
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Documents</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume/CV *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOC up to 5MB</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('resume', e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Portfolio (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <PaperClipIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload portfolio or work samples</p>
                    <p className="text-xs text-gray-500">PDF, Images up to 10MB</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('portfolio', e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Application</h2>
              
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Cover Letter</h3>
                  <p className="text-gray-600 text-sm">{formData.coverLetter}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Experience</h3>
                    <p className="text-gray-600 text-sm">{formData.experience}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Availability</h3>
                    <p className="text-gray-600 text-sm">{formData.availability}</p>
                  </div>
                </div>

                {formData.expectedSalary && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Expected Salary</h3>
                    <p className="text-gray-600 text-sm">{formData.expectedSalary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.coverLetter || !formData.experience}
                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}