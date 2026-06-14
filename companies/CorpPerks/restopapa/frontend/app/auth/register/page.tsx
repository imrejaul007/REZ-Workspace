'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, DocumentIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/components/providers/AuthProvider'

const userTypes = [
  {
    id: 'restaurant',
    title: 'Restaurant Owner/Manager',
    description: 'Manage your restaurant, post jobs, find employees',
    icon: '🏪',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'employee',
    title: 'Restaurant Employee',
    description: 'Find jobs, build your profile, connect with restaurants',
    icon: '👥',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'vendor',
    title: 'Vendor/Supplier',
    description: 'Sell products and services to restaurants',
    icon: '🚚',
    color: 'from-purple-500 to-purple-600'
  }
]

interface FormData {
  userType: string
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  // Restaurant specific
  restaurantName?: string
  restaurantType?: string
  location?: string
  // Employee specific
  position?: string
  experience?: string
  // Vendor specific
  companyName?: string
  businessType?: string
  // Agreement
  agreeToTerms: boolean
  agreeToMarketing: boolean
  // Document verification
  documents: {
    profilePhoto?: File | null
    businessLicense?: File | null
    gstCertificate?: File | null
    fssaiLicense?: File | null
    resume?: File | null
    idProof?: File | null
  }
}

export default function Register() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    userType: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false,
    agreeToMarketing: false,
    documents: {
      profilePhoto: null,
      businessLicense: null,
      gstCertificate: null,
      fssaiLicense: null,
      resume: null,
      idProof: null
    }
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileUpload = (documentType: string, file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: file
      }
    }))
    // Clear any related error
    if (errors[documentType]) {
      setErrors(prev => ({ ...prev, [documentType]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.userType) newErrors.userType = 'Please select account type'
    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.phone) newErrors.phone = 'Phone number is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (formData.userType === 'restaurant') {
      if (!formData.restaurantName) newErrors.restaurantName = 'Restaurant name is required'
      if (!formData.restaurantType) newErrors.restaurantType = 'Restaurant type is required'
      if (!formData.location) newErrors.location = 'Location is required'
    } else if (formData.userType === 'employee') {
      if (!formData.position) newErrors.position = 'Position is required'
      if (!formData.experience) newErrors.experience = 'Experience level is required'
    } else if (formData.userType === 'vendor') {
      if (!formData.companyName) newErrors.companyName = 'Company name is required'
      if (!formData.businessType) newErrors.businessType = 'Business type is required'
    }
    
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {}
    
    // Profile photo is required for all users
    if (!formData.documents.profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required'
    }
    
    // ID proof required for all users
    if (!formData.documents.idProof) {
      newErrors.idProof = 'Government ID proof is required'
    }
    
    if (formData.userType === 'restaurant' || formData.userType === 'vendor') {
      if (!formData.documents.businessLicense) {
        newErrors.businessLicense = 'Business license is required'
      }
      if (!formData.documents.gstCertificate) {
        newErrors.gstCertificate = 'GST certificate is required'
      }
      if (formData.userType === 'restaurant' && !formData.documents.fssaiLicense) {
        newErrors.fssaiLicense = 'FSSAI license is required for restaurants'
      }
    }
    
    if (formData.userType === 'employee') {
      if (!formData.documents.resume) {
        newErrors.resume = 'Resume/CV is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (step === 3 && !validateStep3()) return
    if (step === 2 && !validateStep2()) return
    if (step === 1 && !validateStep1()) return
    
    if (step < 3) {
      handleNext()
      return
    }
    
    setLoading(true)
    setErrors({})

    // Prepare registration data (exclude sensitive fields and File objects)
    const registrationData = {
      userType: formData.userType,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      // Role-specific fields
      ...(formData.userType === 'restaurant' && {
        restaurantName: formData.restaurantName,
        restaurantType: formData.restaurantType,
        location: formData.location,
      }),
      ...(formData.userType === 'employee' && {
        position: formData.position,
        experience: formData.experience,
      }),
      ...(formData.userType === 'vendor' && {
        companyName: formData.companyName,
        businessType: formData.businessType,
      }),
    }

    try {
      // Use AuthProvider's register method which handles API call and token storage securely
      await register(registrationData)
      // AuthProvider handles redirect based on user role
    } catch (error: any) {
      setErrors({ submit: error.message || 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* User Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Account Type *
        </label>
        <div className="grid grid-cols-1 gap-3">
          {userTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => handleInputChange('userType', type.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.userType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center text-2xl`}>
                  {type.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{type.title}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.userType && <p className="mt-1 text-sm text-red-600">{errors.userType}</p>}
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+1 (555) 123-4567"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <EyeIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="w-4 h-4 text-gray-400" />
              ) : (
                <EyeIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Restaurant-specific fields */}
      {formData.userType === 'restaurant' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name *
            </label>
            <input
              type="text"
              value={formData.restaurantName || ''}
              onChange={(e) => handleInputChange('restaurantName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.restaurantName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.restaurantName && <p className="mt-1 text-sm text-red-600">{errors.restaurantName}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Type *
              </label>
              <select
                value={formData.restaurantType || ''}
                onChange={(e) => handleInputChange('restaurantType', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.restaurantType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select type</option>
                <option value="fine-dining">Fine Dining</option>
                <option value="casual-dining">Casual Dining</option>
                <option value="fast-food">Fast Food</option>
                <option value="cafe">Cafe</option>
                <option value="bar">Bar/Pub</option>
                <option value="food-truck">Food Truck</option>
              </select>
              {errors.restaurantType && <p className="mt-1 text-sm text-red-600">{errors.restaurantType}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.location ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>
          </div>
        </>
      )}

      {/* Employee-specific fields */}
      {formData.userType === 'employee' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current/Desired Position *
            </label>
            <select
              value={formData.position || ''}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.position ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select position</option>
              <option value="chef">Chef</option>
              <option value="sous-chef">Sous Chef</option>
              <option value="line-cook">Line Cook</option>
              <option value="server">Server</option>
              <option value="bartender">Bartender</option>
              <option value="manager">Manager</option>
              <option value="host">Host/Hostess</option>
            </select>
            {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level *
            </label>
            <select
              value={formData.experience || ''}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.experience ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select experience</option>
              <option value="entry-level">Entry Level (0-1 years)</option>
              <option value="junior">Junior (1-3 years)</option>
              <option value="mid-level">Mid Level (3-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
              <option value="expert">Expert (10+ years)</option>
            </select>
            {errors.experience && <p className="mt-1 text-sm text-red-600">{errors.experience}</p>}
          </div>
        </div>
      )}

      {/* Vendor-specific fields */}
      {formData.userType === 'vendor' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.companyName || ''}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.companyName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Type *
            </label>
            <select
              value={formData.businessType || ''}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.businessType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select type</option>
              <option value="food-supplier">Food Supplier</option>
              <option value="equipment">Equipment Supplier</option>
              <option value="cleaning">Cleaning Services</option>
              <option value="maintenance">Maintenance Services</option>
              <option value="marketing">Marketing Services</option>
              <option value="technology">Technology Services</option>
            </select>
            {errors.businessType && <p className="mt-1 text-sm text-red-600">{errors.businessType}</p>}
          </div>
        </>
      )}

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
            I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> *
          </label>
        </div>
        {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}
        
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreeToMarketing"
            checked={formData.agreeToMarketing}
            onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="agreeToMarketing" className="text-sm text-gray-700">
            I would like to receive marketing communications about RestaurantHub updates and promotions
          </label>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => {
    const FileUploadComponent = ({ 
      documentType, 
      title, 
      description, 
      required = false,
      acceptedFormats = ".pdf,.jpg,.jpeg,.png"
    }: {
      documentType: string
      title: string
      description: string
      required?: boolean
      acceptedFormats?: string
    }) => {
      const currentFile = formData.documents[documentType as keyof typeof formData.documents]
      
      return (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{title} {required && '*'}</h4>
              <p className="text-xs text-gray-600">{description}</p>
            </div>
            <DocumentIcon className="w-5 h-5 text-gray-400" />
          </div>
          
          {currentFile ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">{currentFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleFileUpload(documentType, null as any)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept={acceptedFormats}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(documentType, file)
                }}
              />
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors">
                <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload</span>
                <span className="text-xs text-gray-500">Max 10MB • {acceptedFormats.replace(/\./g, '').toUpperCase()}</span>
              </div>
            </label>
          )}
          
          {errors[documentType] && (
            <p className="mt-1 text-sm text-red-600">{errors[documentType]}</p>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Verification</h3>
          <p className="text-sm text-gray-600">
            Upload the required documents to verify your identity and business credentials.
            All documents will be securely reviewed within 24-48 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Universal Documents */}
          <FileUploadComponent
            documentType="profilePhoto"
            title="Profile Photo"
            description="Clear headshot for your profile"
            required={true}
            acceptedFormats=".jpg,.jpeg,.png"
          />
          
          <FileUploadComponent
            documentType="idProof"
            title="Government ID Proof"
            description="Aadhar, PAN, or Passport"
            required={true}
            acceptedFormats=".pdf,.jpg,.jpeg,.png"
          />

          {/* Restaurant/Vendor Documents */}
          {(formData.userType === 'restaurant' || formData.userType === 'vendor') && (
            <>
              <FileUploadComponent
                documentType="businessLicense"
                title="Business License"
                description="Business registration certificate"
                required={true}
                acceptedFormats=".pdf,.jpg,.jpeg,.png"
              />
              
              <FileUploadComponent
                documentType="gstCertificate"
                title="GST Certificate"
                description="GST registration certificate"
                required={true}
                acceptedFormats=".pdf,.jpg,.jpeg,.png"
              />
            </>
          )}

          {/* Restaurant Specific */}
          {formData.userType === 'restaurant' && (
            <FileUploadComponent
              documentType="fssaiLicense"
              title="FSSAI License"
              description="Food safety license"
              required={true}
              acceptedFormats=".pdf,.jpg,.jpeg,.png"
            />
          )}

          {/* Employee Specific */}
          {formData.userType === 'employee' && (
            <FileUploadComponent
              documentType="resume"
              title="Resume/CV"
              description="Your latest resume"
              required={true}
              acceptedFormats=".pdf,.doc,.docx"
            />
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <DocumentIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Document Verification Process</h4>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• Documents are reviewed within 24-48 hours</li>
                <li>• You'll receive an email notification once verified</li>
                <li>• Verified accounts get access to premium features</li>
                <li>• All documents are stored securely and encrypted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">RestaurantHub</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the restaurant industry's premier networking platform
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > 1 ? <CheckCircleIcon className="w-5 h-5" /> : '1'}
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > 2 ? <CheckCircleIcon className="w-5 h-5" /> : '2'}
              </div>
              <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">Account Info</span>
              <span className="text-xs text-gray-600">Profile Details</span>
              <span className="text-xs text-gray-600">Verification</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}

            {errors.submit && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className={`${step === 1 ? 'w-full' : 'flex-1 ml-3'} flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : step === 3 ? 'Complete Registration' : 'Continue'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}