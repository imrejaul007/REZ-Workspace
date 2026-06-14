'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function Settings() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    // Profile
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    position: 'Restaurant Manager',
    bio: 'Experienced restaurant manager with 10+ years in the industry.',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    jobAlerts: true,
    marketplaceDeals: true,
    communityUpdates: false,
    
    // Privacy
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    
    // Account
    twoFactorAuth: false,
    password: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const sections = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon },
    { id: 'account', name: 'Account', icon: GlobeAltIcon },
    { id: 'help', name: 'Help & Support', icon: QuestionMarkCircleIcon }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    // Save settings logic here
    logger.info('Settings saved:', formData)
  }

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Delete account logic here
      logger.info('Account deleted')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
            
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
          
          <Breadcrumbs 
            items={[
              { name: 'Dashboard', href: '/dashboard/restaurant' },
              { name: 'Settings', current: true }
            ]}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{section.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              
              {/* Profile Settings */}
              {activeSection === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position/Role</label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          rows={4}
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-gray-500" />
                      </div>
                      <div>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                          Upload Photo
                        </button>
                        <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Receive important updates via email</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('emailNotifications', !formData.emailNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Push Notifications</h3>
                          <p className="text-sm text-gray-600">Receive notifications on your device</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('pushNotifications', !formData.pushNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Job Alerts</h3>
                          <p className="text-sm text-gray-600">Get notified about new job opportunities</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('jobAlerts', !formData.jobAlerts)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.jobAlerts ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.jobAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Marketplace Deals</h3>
                          <p className="text-sm text-gray-600">Be the first to know about special offers</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('marketplaceDeals', !formData.marketplaceDeals)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.marketplaceDeals ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.marketplaceDeals ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Community Updates</h3>
                          <p className="text-sm text-gray-600">Stay updated with community discussions</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('communityUpdates', !formData.communityUpdates)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.communityUpdates ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.communityUpdates ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Settings</h2>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-2">Profile Visibility</h3>
                        <select
                          value={formData.profileVisibility}
                          onChange={(e) => handleInputChange('profileVisibility', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="public">Public - Anyone can view</option>
                          <option value="restaurants">Restaurants Only</option>
                          <option value="private">Private - Hidden from search</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Show Email Address</h3>
                          <p className="text-sm text-gray-600">Allow others to see your email</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('showEmail', !formData.showEmail)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.showEmail ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.showEmail ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Show Phone Number</h3>
                          <p className="text-sm text-gray-600">Allow others to see your phone</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('showPhone', !formData.showPhone)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.showPhone ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.showPhone ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Settings */}
              {activeSection === 'billing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing & Subscription</h2>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <h3 className="font-medium text-green-900">Free Plan</h3>
                      </div>
                      <p className="text-sm text-green-700">You're currently on the free plan with basic features.</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="font-medium text-gray-900 mb-4">Upgrade to Premium</h3>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Unlimited job applications</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Priority customer support</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Advanced analytics</span>
                        </div>
                      </div>
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Upgrade for $9.99/month
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {activeSection === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Security</h2>
                    
                    <div className="space-y-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <input
                              type="password"
                              value={formData.newPassword}
                              onChange={(e) => handleInputChange('newPassword', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <input
                              type="password"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Update Password
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <button
                          onClick={() => handleInputChange('twoFactorAuth', !formData.twoFactorAuth)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            formData.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            formData.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="font-medium text-red-600 mb-4">Danger Zone</h3>
                        <div className="border border-red-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Delete Account</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Once you delete your account, all your data will be permanently removed. This action cannot be undone.
                          </p>
                          <button
                            onClick={handleDeleteAccount}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Help & Support */}
              {activeSection === 'help' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Help & Support</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Contact Support</h3>
                        <p className="text-sm text-gray-600 mb-4">Get help from our support team</p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                          Contact Us
                        </button>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Help Center</h3>
                        <p className="text-sm text-gray-600 mb-4">Browse our knowledge base</p>
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                          Visit Help Center
                        </button>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Feature Request</h3>
                        <p className="text-sm text-gray-600 mb-4">Suggest new features</p>
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                          Submit Request
                        </button>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Report Bug</h3>
                        <p className="text-sm text-gray-600 mb-4">Report technical issues</p>
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                          Report Bug
                        </button>
                      </div>
                    </div>
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