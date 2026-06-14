'use client'

import { useState } from 'react'
import { 
  UserCircleIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  TruckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  PencilIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface BusinessProfile {
  businessName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  businessLicense: string
  taxId: string
  description: string
  website: string
  logo?: string
}

interface NotificationSettings {
  orderNotifications: boolean
  paymentNotifications: boolean
  reviewNotifications: boolean
  marketingEmails: boolean
  smsNotifications: boolean
  weeklyReports: boolean
}

interface DeliverySettings {
  deliveryZones: string[]
  minimumOrder: number
  deliveryFee: number
  freeDeliveryThreshold: number
  deliveryTimeSlots: string[]
  maxDeliveryDistance: number
}

export default function VendorSettings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const [profile, setProfile] = useState<BusinessProfile>({
    businessName: 'Farm Fresh Produce Co.',
    contactPerson: 'John Smith',
    email: 'john@farmfresh.com',
    phone: '+1 (555) 123-4567',
    address: '123 Farm Road',
    city: 'Sacramento',
    state: 'CA',
    zipCode: '95814',
    businessLicense: 'BL-2023-001234',
    taxId: '12-3456789',
    description: 'Premium organic produce supplier specializing in locally grown vegetables and herbs.',
    website: 'https://farmfreshproduce.com'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    orderNotifications: true,
    paymentNotifications: true,
    reviewNotifications: true,
    marketingEmails: false,
    smsNotifications: true,
    weeklyReports: true
  })

  const [delivery, setDelivery] = useState<DeliverySettings>({
    deliveryZones: ['Downtown', 'Midtown', 'Uptown'],
    minimumOrder: 50,
    deliveryFee: 5.99,
    freeDeliveryThreshold: 100,
    deliveryTimeSlots: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM'],
    maxDeliveryDistance: 25
  })

  const handleProfileUpdate = () => {
    logger.info('Profile updated:', profile)
  }

  const handleNotificationUpdate = () => {
    logger.info('Notifications updated:', notifications)
  }

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    logger.info('Password changed')
    setShowPasswordChange(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeactivateAccount = () => {
    if (confirm('Are you sure you want to deactivate your account? This action cannot be undone.')) {
      logger.info('Account deactivated')
    }
  }

  const tabs = [
    { id: 'profile', name: 'Business Profile', icon: BuildingStorefrontIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'delivery', name: 'Delivery Settings', icon: TruckIcon },
    { id: 'billing', name: 'Billing & Payments', icon: CreditCardIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'danger', name: 'Danger Zone', icon: ExclamationTriangleIcon }
  ]

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your business profile and preferences</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Business Profile</h3>
                <button
                  onClick={handleProfileUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      {profile.logo ? (
                        <img src={profile.logo} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <BuildingStorefrontIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                      Upload Logo
                    </button>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      value={profile.businessName}
                      onChange={(e) => setProfile(prev => ({ ...prev, businessName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      value={profile.contactPerson}
                      onChange={(e) => setProfile(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Business Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={profile.state}
                        onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                      <input
                        type="text"
                        value={profile.zipCode}
                        onChange={(e) => setProfile(prev => ({ ...prev, zipCode: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Business Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Business License</label>
                      <input
                        type="text"
                        value={profile.businessLicense}
                        onChange={(e) => setProfile(prev => ({ ...prev, businessLicense: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                      <input
                        type="text"
                        value={profile.taxId}
                        onChange={(e) => setProfile(prev => ({ ...prev, taxId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                    <textarea
                      rows={4}
                      value={profile.description}
                      onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your business and what makes it special..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                <button
                  onClick={handleNotificationUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {key === 'orderNotifications' && 'Get notified when you receive new orders'}
                        {key === 'paymentNotifications' && 'Get notified about payment confirmations and issues'}
                        {key === 'reviewNotifications' && 'Get notified when customers leave reviews'}
                        {key === 'marketingEmails' && 'Receive marketing emails and promotional content'}
                        {key === 'smsNotifications' && 'Receive notifications via SMS'}
                        {key === 'weeklyReports' && 'Get weekly performance and analytics reports'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Settings</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order ($)</label>
                    <input
                      type="number"
                      value={delivery.minimumOrder}
                      onChange={(e) => setDelivery(prev => ({ ...prev, minimumOrder: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={delivery.deliveryFee}
                      onChange={(e) => setDelivery(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Delivery Threshold ($)</label>
                    <input
                      type="number"
                      value={delivery.freeDeliveryThreshold}
                      onChange={(e) => setDelivery(prev => ({ ...prev, freeDeliveryThreshold: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Delivery Distance (miles)</label>
                    <input
                      type="number"
                      value={delivery.maxDeliveryDistance}
                      onChange={(e) => setDelivery(prev => ({ ...prev, maxDeliveryDistance: Number(e.target.value) }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Zones</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {delivery.deliveryZones.map((zone, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        {zone}
                        <button
                          onClick={() => setDelivery(prev => ({
                            ...prev,
                            deliveryZones: prev.deliveryZones.filter((_, i) => i !== index)
                          }))}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Zone</button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time Slots</label>
                  <div className="space-y-2">
                    {delivery.deliveryTimeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-900">{slot}</span>
                        <button
                          onClick={() => setDelivery(prev => ({
                            ...prev,
                            deliveryTimeSlots: prev.deliveryTimeSlots.filter((_, i) => i !== index)
                          }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2">+ Add Time Slot</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>

              <div className="space-y-6">
                {/* Password Change */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-900">Password</h4>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showPasswordChange ? 'Cancel' : 'Change Password'}
                    </button>
                  </div>

                  {showPasswordChange && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showCurrentPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showNewPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={handlePasswordChange}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Update Password
                      </button>
                    </div>
                  )}
                </div>

                {/* Two-Factor Authentication */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Enable 2FA
                  </button>
                </div>

                {/* Login Sessions */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Active Sessions</h4>
                  <p className="text-sm text-gray-600 mb-4">Manage your active login sessions</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Current Session</p>
                        <p className="text-xs text-gray-500">Chrome on MacOS • Last active now</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Mobile App</p>
                        <p className="text-xs text-gray-500">iPhone • Last active 2 hours ago</p>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-xs font-medium">
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-center mb-6">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
              </div>

              <div className="space-y-6">
                <div className="border border-red-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-red-900 mb-2">Deactivate Account</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Temporarily deactivate your account. You can reactivate it anytime by logging in.
                  </p>
                  <button
                    onClick={handleDeactivateAccount}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Deactivate Account
                  </button>
                </div>

                <div className="border border-red-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-red-900 mb-2">Delete Account</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}