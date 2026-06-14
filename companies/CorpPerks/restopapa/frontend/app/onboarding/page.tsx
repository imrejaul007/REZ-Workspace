'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  StarIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CogIcon,
  ClockIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Resturistan',
    subtitle: 'Your complete restaurant industry platform',
    description: 'Connect restaurants, employees, and vendors in one powerful ecosystem. Manage jobs, orders, and build your professional network.',
    image: '🏢',
    features: [
      'Find restaurant jobs or hire staff',
      'Order supplies from verified vendors',
      'Build your professional network',
      'Manage your business operations'
    ]
  },
  {
    id: 'verification-status',
    title: 'Document Verification Status',
    subtitle: 'Your documents are being reviewed',
    description: 'We are securely reviewing your submitted documents to verify your account. This usually takes 24-48 hours.',
    image: '📋'
  },
  {
    id: 'user-type',
    title: 'Choose Your Role',
    subtitle: 'Select how you want to use Resturistan',
    description: 'Choose your primary role to get a personalized experience tailored to your needs.',
    options: [
      {
        id: 'restaurant',
        name: 'Restaurant Owner/Manager',
        description: 'Hire staff, manage operations, order supplies',
        icon: BuildingStorefrontIcon,
        color: 'blue',
        features: ['Post job openings', 'Order from vendors', 'Manage staff', 'Track analytics']
      },
      {
        id: 'employee',
        name: 'Restaurant Employee',
        description: 'Find jobs, build your career, connect with peers',
        icon: UserGroupIcon,
        color: 'green',
        features: ['Browse job openings', 'Apply to positions', 'Build your profile', 'Network with professionals']
      },
      {
        id: 'vendor',
        name: 'Supplier/Vendor',
        description: 'Sell to restaurants, manage inventory, grow business',
        icon: ShoppingBagIcon,
        color: 'purple',
        features: ['List products', 'Manage orders', 'Connect with restaurants', 'Track sales']
      }
    ]
  },
  {
    id: 'features',
    title: 'Platform Features',
    subtitle: 'Everything you need in one place',
    description: 'Discover the powerful features that make Resturistan the ultimate restaurant industry platform.',
    features: [
      {
        icon: BriefcaseIcon,
        title: 'Job Portal',
        description: 'Post jobs, find talent, apply to positions, build your career'
      },
      {
        icon: ShoppingCartIcon,
        title: 'Marketplace',
        description: 'Order supplies, manage inventory, connect with vendors'
      },
      {
        icon: ChatBubbleLeftRightIcon,
        title: 'Professional Network',
        description: 'Connect with industry peers, share knowledge, build relationships'
      },
      {
        icon: ChartBarIcon,
        title: 'Analytics & Insights',
        description: 'Track performance, analyze trends, make data-driven decisions'
      }
    ]
  },
  {
    id: 'setup',
    title: 'Setup Your Profile',
    subtitle: 'Complete your profile to get started',
    description: 'Tell us a bit more about yourself to personalize your experience and help you connect with the right opportunities.',
    image: '👤'
  }
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedUserType, setSelectedUserType] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('pending') // pending, verified, rejected
  const [profileData, setProfileData] = useState({
    businessName: '',
    personalName: '',
    location: '',
    experience: '',
    interests: []
  })
  const router = useRouter()

  const currentStepData = onboardingSteps[currentStep]
  const isLastStep = currentStep === onboardingSteps.length - 1

  const handleNext = () => {
    if (currentStep === 1 && !selectedUserType) {
      alert('Please select your role to continue')
      return
    }

    if (isLastStep) {
      // Complete onboarding and redirect based on user type
      completeOnboarding()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = () => {
    // Save onboarding completion status
    localStorage.setItem('onboardingCompleted', 'true')
    localStorage.setItem('userType', selectedUserType)
    localStorage.setItem('profileData', JSON.stringify(profileData))

    // Redirect based on user type
    const dashboardRoutes = {
      restaurant: '/dashboard/restaurant',
      employee: '/dashboard/employee',
      vendor: '/dashboard/vendor'
    }

    const route = dashboardRoutes[selectedUserType as keyof typeof dashboardRoutes] || '/dashboard'
    router.push(route)
  }

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip onboarding? You can always complete your profile later.')) {
      completeOnboarding()
    }
  }

  const renderWelcomeStep = () => (
    <div className="text-center">
      <div className="text-8xl mb-6">{currentStepData.image}</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{currentStepData.title}</h1>
      <p className="text-xl text-gray-600 mb-8">{currentStepData.subtitle}</p>
      <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
        {currentStepData.description}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {currentStepData.features?.map((feature, index) => (
          <div key={index} className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
            <span className="text-gray-800">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUserTypeStep = () => (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentStepData.title}</h1>
      <p className="text-gray-600 mb-8">{currentStepData.description}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {currentStepData.options?.map((option) => {
          const Icon = option.icon
          const isSelected = selectedUserType === option.id
          
          return (
            <div
              key={option.id}
              onClick={() => setSelectedUserType(option.id)}
              className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                isSelected 
                  ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-200`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isSelected ? `bg-${option.color}-100` : 'bg-gray-100'
              }`}>
                <Icon className={`w-8 h-8 ${
                  isSelected ? `text-${option.color}-600` : 'text-gray-600'
                }`} />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{option.name}</h3>
              <p className="text-gray-600 mb-4 text-sm">{option.description}</p>
              
              <div className="space-y-2">
                {option.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? `bg-${option.color}-500` : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderFeaturesStep = () => (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentStepData.title}</h1>
      <p className="text-gray-600 mb-8">{currentStepData.description}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {currentStepData.features?.map((feature, index) => {
          const Icon = feature.icon
          
          return (
            <div key={index} className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderVerificationStatusStep = () => {
    const getVerificationContent = () => {
      switch (verificationStatus) {
        case 'verified':
          return {
            icon: CheckCircleIcon,
            iconClass: 'text-green-600',
            bgClass: 'bg-green-100',
            title: 'Documents Verified!',
            description: 'Great! Your documents have been successfully verified. You now have access to all platform features.',
            features: [
              'Post jobs and apply to positions',
              'Access marketplace and vendor tools',
              'Join community forums and networking',
              'View detailed analytics and insights'
            ]
          }
        case 'rejected':
          return {
            icon: ExclamationTriangleIcon,
            iconClass: 'text-red-600',
            bgClass: 'bg-red-100',
            title: 'Verification Issues',
            description: 'Some of your documents need attention. Please review and resubmit the required documents.',
            features: [
              'Check your email for specific feedback',
              'Upload clearer or corrected documents',
              'Ensure all required fields are completed',
              'Contact support if you need assistance'
            ]
          }
        default: // pending
          return {
            icon: ClockIcon,
            iconClass: 'text-blue-600',
            bgClass: 'bg-blue-100',
            title: 'Documents Under Review',
            description: 'We are securely reviewing your submitted documents. This process usually takes 24-48 hours.',
            features: [
              'We\'ll email you once verification is complete',
              'You can access basic features while we review',
              'All documents are encrypted and secure',
              'Our team manually reviews each submission'
            ]
          }
      }
    }

    const content = getVerificationContent()
    const Icon = content.icon

    return (
      <div className="text-center">
        <div className={`w-16 h-16 ${content.bgClass} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-10 h-10 ${content.iconClass}`} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          {content.description}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {content.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <DocumentIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
              <span className="text-gray-800 text-left">{feature}</span>
            </div>
          ))}
        </div>

        {verificationStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <ClockIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-yellow-900">What's Next?</h4>
                <p className="mt-1 text-sm text-yellow-800">
                  You can continue setting up your profile while we review your documents. 
                  Once verified, you'll unlock all premium features including advanced job posting, 
                  marketplace access, and community networking.
                </p>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-red-900">Action Required</h4>
                <p className="mt-1 text-sm text-red-800">
                  Please check your email for specific feedback on your documents. 
                  You can resubmit documents from your account settings at any time.
                </p>
                <button 
                  onClick={() => router.push('/dashboard/restaurant/verification')}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Go to Verification Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSetupStep = () => (
    <div className="text-center">
      <div className="text-6xl mb-6">{currentStepData.image}</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentStepData.title}</h1>
      <p className="text-gray-600 mb-8">{currentStepData.description}</p>
      
      <div className="max-w-md mx-auto space-y-4">
        {selectedUserType === 'restaurant' && (
          <>
            <input
              type="text"
              placeholder="Restaurant Name"
              value={profileData.businessName}
              onChange={(e) => setProfileData({...profileData, businessName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Your Name"
              value={profileData.personalName}
              onChange={(e) => setProfileData({...profileData, personalName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </>
        )}
        
        {selectedUserType === 'employee' && (
          <>
            <input
              type="text"
              placeholder="Your Full Name"
              value={profileData.personalName}
              onChange={(e) => setProfileData({...profileData, personalName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={profileData.experience}
              onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Experience Level</option>
              <option value="entry">Entry Level (0-1 years)</option>
              <option value="junior">Junior (1-3 years)</option>
              <option value="mid">Mid Level (3-5 years)</option>
              <option value="senior">Senior (5+ years)</option>
            </select>
          </>
        )}
        
        {selectedUserType === 'vendor' && (
          <>
            <input
              type="text"
              placeholder="Business Name"
              value={profileData.businessName}
              onChange={(e) => setProfileData({...profileData, businessName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Your Name"
              value={profileData.personalName}
              onChange={(e) => setProfileData({...profileData, personalName: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </>
        )}
        
        <input
          type="text"
          placeholder="Location (City, State)"
          value={profileData.location}
          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <p className="text-sm text-gray-500 mt-6">
        Don't worry, you can always update this information later in your profile settings.
      </p>
    </div>
  )

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return renderWelcomeStep()
      case 'verification-status':
        return renderVerificationStatusStep()
      case 'user-type':
        return renderUserTypeStep()
      case 'features':
        return renderFeaturesStep()
      case 'setup':
        return renderSetupStep()
      default:
        return renderWelcomeStep()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-blue-600">Resturistan</div>
            </div>
            
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {onboardingSteps.length}</span>
            <span className="text-sm text-gray-600">{Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white'
            }`}
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>{isLastStep ? 'Get Started' : 'Continue'}</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}