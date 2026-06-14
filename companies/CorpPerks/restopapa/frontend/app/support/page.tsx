'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  BugAntIcon,
  CreditCardIcon,
  UserGroupIcon,
  PaperClipIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface SupportTicket {
  subject: string
  category: string
  priority: string
  description: string
  attachments: File[]
  email: string
  name: string
}

export default function SupportTicket() {
  const router = useRouter()
  const [formData, setFormData] = useState<SupportTicket>({
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
    attachments: [],
    email: '',
    name: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  const categories = [
    { id: 'technical', name: 'Technical Issue', icon: BugAntIcon, description: 'Login problems, bugs, or system errors' },
    { id: 'billing', name: 'Billing & Payments', icon: CreditCardIcon, description: 'Payment issues, invoices, or subscription questions' },
    { id: 'account', name: 'Account Management', icon: UserGroupIcon, description: 'Profile settings, verification, or account access' },
    { id: 'general', name: 'General Inquiry', icon: QuestionMarkCircleIcon, description: 'Questions about features or how to use the platform' }
  ]

  const handleInputChange = (field: keyof SupportTicket, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }))
  }

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email'
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
    if (!formData.category) newErrors.category = 'Please select a category'
    if (!formData.description.trim()) newErrors.description = 'Please describe your issue'
    else if (formData.description.length < 20) newErrors.description = 'Please provide more details (minimum 20 characters)'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setSubmitted(true)
    } catch (error) {
      setErrors({ general: 'Failed to submit ticket. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted!</h2>
          <p className="text-gray-600 mb-6">
            We've received your support request and will respond within 4 hours. 
            You'll receive an email confirmation shortly.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Ticket Reference</p>
            <p className="font-mono font-bold text-gray-900">#SUPP-{Date.now().toString().slice(-6)}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/help')}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
            >
              Browse Help
            </button>
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
              <p className="text-gray-600 mt-1">Get help from our support team</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="p-8">
              {/* Contact Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Issue Category */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">What can we help you with?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((category) => {
                    const Icon = category.icon
                    return (
                      <label key={category.id} className="cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={formData.category === category.id}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`border-2 rounded-lg p-4 transition-all ${
                          formData.category === category.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-start">
                            <Icon className={`w-6 h-6 mt-1 mr-3 ${
                              formData.category === category.id ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div>
                              <h3 className="font-semibold text-gray-900">{category.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
                {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
              </div>

              {/* Subject and Priority */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your issue"
                    />
                    {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide detailed information about your issue, including steps to reproduce the problem if applicable..."
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                  <p className="text-sm text-gray-500 ml-auto">{formData.description.length} characters</p>
                </div>
              </div>

              {/* File Attachments */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <PaperClipIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Drag and drop files here or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Choose Files
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Max file size: 10MB. Supported formats: JPG, PNG, PDF, DOC
                  </p>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <PaperClipIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-700 ml-2">{errors.general}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="border-t bg-gray-50 px-8 py-4 rounded-b-lg">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  We typically respond within 4 hours during business hours.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}