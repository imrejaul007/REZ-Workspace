'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircleIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  Cog8ToothIcon,
  PlusIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

export default function OnboardingComplete() {
  const [userType, setUserType] = useState('')
  const [profileData, setProfileData] = useState<any>({})
  const router = useRouter()

  useEffect(() => {
    const savedUserType = localStorage.getItem('userType')
    const savedProfileData = localStorage.getItem('profileData')
    
    if (savedUserType) {
      setUserType(savedUserType)
    }
    
    if (savedProfileData) {
      try {
        setProfileData(JSON.parse(savedProfileData))
      } catch (error) {
        logger.error('Error parsing profile data:', error)
      }
    }
  }, [])

  const getWelcomeMessage = () => {
    const name = profileData.personalName || profileData.businessName || 'there'
    return `Welcome aboard, ${name}!`
  }

  const getRoleIcon = () => {
    switch (userType) {
      case 'restaurant':
        return BuildingStorefrontIcon
      case 'employee':
        return UserGroupIcon
      case 'vendor':
        return ShoppingBagIcon
      default:
        return UserCircleIcon
    }
  }

  const getRoleColor = () => {
    switch (userType) {
      case 'restaurant':
        return 'blue'
      case 'employee':
        return 'green'
      case 'vendor':
        return 'purple'
      default:
        return 'gray'
    }
  }

  const getNextSteps = () => {
    switch (userType) {
      case 'restaurant':
        return [
          {
            icon: UserCircleIcon,
            title: 'Complete Your Restaurant Profile',
            description: 'Add photos, menu details, and business information',
            action: 'Complete Profile',
            href: '/profile/restaurant/edit'
          },
          {
            icon: BriefcaseIcon,
            title: 'Post Your First Job',
            description: 'Start hiring by posting open positions',
            action: 'Post Job',
            href: '/jobs/create'
          },
          {
            icon: ShoppingCartIcon,
            title: 'Explore Marketplace',
            description: 'Find suppliers and order restaurant supplies',
            action: 'Browse Suppliers',
            href: '/marketplace'
          },
          {
            icon: Cog8ToothIcon,
            title: 'Setup Business Settings',
            description: 'Configure payment methods and notifications',
            action: 'Manage Settings',
            href: '/settings'
          }
        ]
      case 'employee':
        return [
          {
            icon: UserCircleIcon,
            title: 'Build Your Profile',
            description: 'Add your experience, skills, and work history',
            action: 'Complete Profile',
            href: '/profile/employee/edit'
          },
          {
            icon: DocumentTextIcon,
            title: 'Upload Your Resume',
            description: 'Add your resume to improve job applications',
            action: 'Upload Resume',
            href: '/profile/employee/edit#resume'
          },
          {
            icon: BriefcaseIcon,
            title: 'Browse Job Openings',
            description: 'Find restaurant jobs that match your skills',
            action: 'Find Jobs',
            href: '/jobs'
          },
          {
            icon: UserGroupIcon,
            title: 'Connect with Professionals',
            description: 'Build your network in the restaurant industry',
            action: 'Explore Community',
            href: '/community'
          }
        ]
      case 'vendor':
        return [
          {
            icon: UserCircleIcon,
            title: 'Complete Business Profile',
            description: 'Add company details and certifications',
            action: 'Complete Profile',
            href: '/profile/vendor/edit'
          },
          {
            icon: PlusIcon,
            title: 'Add Your Products',
            description: 'List products and services you offer',
            action: 'Add Products',
            href: '/vendor/products/new'
          },
          {
            icon: PhotoIcon,
            title: 'Upload Product Photos',
            description: 'Showcase your products with high-quality images',
            action: 'Add Photos',
            href: '/vendor/products'
          },
          {
            icon: ShoppingCartIcon,
            title: 'Connect with Restaurants',
            description: 'Start receiving orders from restaurants',
            action: 'View Orders',
            href: '/dashboard/vendor'
          }
        ]
      default:
        return []
    }
  }

  const handleGetStarted = () => {
    const dashboardRoutes = {
      restaurant: '/dashboard/restaurant',
      employee: '/dashboard/employee',
      vendor: '/dashboard/vendor'
    }
    
    const route = dashboardRoutes[userType as keyof typeof dashboardRoutes] || '/dashboard'
    router.push(route)
  }

  const RoleIcon = getRoleIcon()
  const roleColor = getRoleColor()
  const nextSteps = getNextSteps()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-2xl font-bold text-blue-600">Resturistan</div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success Message */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{getWelcomeMessage()}</h1>
          <p className="text-lg text-gray-600 mb-6">
            Your account has been set up successfully. Let's get you started on your journey.
          </p>

          {/* Role Badge */}
          <div className={`inline-flex items-center space-x-3 px-6 py-3 bg-${roleColor}-100 text-${roleColor}-800 rounded-full`}>
            <RoleIcon className="w-6 h-6" />
            <span className="font-medium">
              {userType === 'restaurant' && 'Restaurant Owner/Manager'}
              {userType === 'employee' && 'Restaurant Employee'}
              {userType === 'vendor' && 'Supplier/Vendor'}
            </span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recommended Next Steps</h2>
          <p className="text-gray-600 mb-8">
            Complete these steps to make the most of your Resturistan experience.
          </p>

          <div className="space-y-4">
            {nextSteps.map((step, index) => {
              const StepIcon = step.icon
              
              return (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => router.push(step.href)}
                >
                  <div className={`w-12 h-12 bg-${roleColor}-100 rounded-lg flex items-center justify-center group-hover:bg-${roleColor}-200 transition-colors`}>
                    <StepIcon className={`w-6 h-6 text-${roleColor}-600`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium text-${roleColor}-600 group-hover:text-blue-600 transition-colors`}>
                      {step.action}
                    </span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-8 border-t border-gray-200">
            <button
              onClick={handleGetStarted}
              className={`flex-1 bg-${roleColor}-600 text-white py-3 px-6 rounded-lg hover:bg-${roleColor}-700 transition-colors font-medium`}
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => router.push('/help')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Get Help
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Pro Tips to Get Started</h3>
          <div className="space-y-3 text-blue-800">
            {userType === 'restaurant' && (
              <>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Complete your restaurant profile with high-quality photos to attract both employees and customers.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Post detailed job descriptions to find the right candidates faster.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Connect with multiple suppliers to ensure competitive pricing and reliability.</p>
                </div>
              </>
            )}
            
            {userType === 'employee' && (
              <>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Upload a professional resume and add detailed work experience to stand out.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Set up job alerts to be notified of new opportunities matching your skills.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Connect with other professionals to build your network and learn about opportunities.</p>
                </div>
              </>
            )}
            
            {userType === 'vendor' && (
              <>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Add detailed product descriptions and high-quality images to increase sales.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Keep your inventory updated and respond quickly to restaurant orders.</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">Build relationships with restaurants for repeat business and referrals.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}