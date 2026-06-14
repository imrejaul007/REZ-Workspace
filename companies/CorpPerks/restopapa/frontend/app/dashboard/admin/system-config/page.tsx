'use client'

import { useState } from 'react'
import {
  CogIcon,
  KeyIcon,
  PaintBrushIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  BellIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface SystemConfig {
  platform: {
    name: string
    tagline: string
    description: string
    supportEmail: string
    supportPhone: string
    website: string
    logo: string
    favicon: string
    primaryColor: string
    secondaryColor: string
    timezone: string
    currency: string
    language: string
  }
  features: {
    userRegistration: boolean
    emailVerification: boolean
    phoneVerification: boolean
    twoFactorAuth: boolean
    socialLogin: boolean
    guestCheckout: boolean
    multiCurrency: boolean
    multiLanguage: boolean
    darkMode: boolean
    maintenance: boolean
  }
  security: {
    passwordMinLength: number
    passwordRequireSpecial: boolean
    passwordRequireNumbers: boolean
    passwordRequireUppercase: boolean
    sessionTimeout: number
    maxLoginAttempts: number
    ipWhitelist: string[]
    enableCaptcha: boolean
    enableRateLimit: boolean
    rateLimitRequests: number
    rateLimitWindow: number
  }
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses'
    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpPassword: string
    fromEmail: string
    fromName: string
    replyTo: string
  }
  sms: {
    provider: 'twilio' | 'nexmo' | 'aws_sns' | 'textlocal'
    accountSid: string
    authToken: string
    fromNumber: string
  }
  payment: {
    razorpayKeyId: string
    razorpayKeySecret: string
    stripePublishableKey: string
    stripeSecretKey: string
    paytmMerchantId: string
    paytmMerchantKey: string
    enableCOD: boolean
    enableUPI: boolean
    enableWallet: boolean
    currency: string
    taxRate: number
    processingFee: number
  }
  storage: {
    provider: 'local' | 'aws_s3' | 'cloudinary' | 'google_cloud'
    awsBucket: string
    awsAccessKey: string
    awsSecretKey: string
    awsRegion: string
    maxFileSize: number
    allowedFileTypes: string[]
  }
  social: {
    googleClientId: string
    googleClientSecret: string
    facebookAppId: string
    facebookAppSecret: string
    linkedinClientId: string
    linkedinClientSecret: string
  }
}

const defaultConfig: SystemConfig = {
  platform: {
    name: 'Resturistan',
    tagline: 'Restaurant Industry Platform',
    description: 'Complete SaaS solution for restaurants, employees, and vendors',
    supportEmail: 'support@resturistan.com',
    supportPhone: '+91 1800-RESTRO',
    website: 'https://resturistan.com',
    logo: '/logos/resturistan-logo.png',
    favicon: '/favicon.ico',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    language: 'en'
  },
  features: {
    userRegistration: true,
    emailVerification: true,
    phoneVerification: true,
    twoFactorAuth: false,
    socialLogin: true,
    guestCheckout: false,
    multiCurrency: false,
    multiLanguage: false,
    darkMode: true,
    maintenance: false
  },
  security: {
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: [],
    enableCaptcha: true,
    enableRateLimit: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60
  },
  email: {
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@resturistan.com',
    fromName: 'Resturistan Platform',
    replyTo: 'support@resturistan.com'
  },
  sms: {
    provider: 'twilio',
    accountSid: '',
    authToken: '',
    fromNumber: ''
  },
  payment: {
    razorpayKeyId: '',
    razorpayKeySecret: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    paytmMerchantId: '',
    paytmMerchantKey: '',
    enableCOD: true,
    enableUPI: true,
    enableWallet: true,
    currency: 'INR',
    taxRate: 18,
    processingFee: 2.5
  },
  storage: {
    provider: 'aws_s3',
    awsBucket: 'resturistan-storage',
    awsAccessKey: '',
    awsSecretKey: '',
    awsRegion: 'ap-south-1',
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  },
  social: {
    googleClientId: '',
    googleClientSecret: '',
    facebookAppId: '',
    facebookAppSecret: '',
    linkedinClientId: '',
    linkedinClientSecret: ''
  }
}

export default function SystemConfiguration() {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig)
  const [activeTab, setActiveTab] = useState('platform')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const tabs = [
    { id: 'platform', name: 'Platform Settings', icon: CogIcon },
    { id: 'features', name: 'Feature Flags', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'integrations', name: 'Integrations', icon: KeyIcon },
    { id: 'appearance', name: 'Appearance', icon: PaintBrushIcon },
    { id: 'notifications', name: 'Notifications', icon: EnvelopeIcon }
  ]

  const updateConfig = (section: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const toggleSecret = (fieldName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const addToArray = (section: string, field: string, value: string) => {
    if (value.trim()) {
      setConfig(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: [...prev[section][field], value.trim()]
        }
      }))
      setHasChanges(true)
    }
  }

  const removeFromArray = (section: string, field: string, index: number) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }))
    setHasChanges(true)
  }

  const saveConfiguration = async () => {
    try {
      // Here you would make an API call to save the configuration
      logger.info('Saving configuration:', config)
      setHasChanges(false)
      // Show success message
    } catch (error) {
      logger.error('Failed to save configuration:', error)
      // Show error message
    }
  }

  const resetConfiguration = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setConfig(defaultConfig)
      setHasChanges(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
            <p className="text-gray-600 mt-2">Manage platform settings, integrations, and configurations</p>
          </div>
          
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Unsaved Changes</span>
              </div>
            )}
            <button
              onClick={resetConfiguration}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Reset to Default
            </button>
            <button
              onClick={saveConfiguration}
              disabled={!hasChanges}
              className={`px-6 py-2 rounded-lg flex items-center space-x-2 ${
                hasChanges
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckIcon className="w-5 h-5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Platform Settings Tab */}
        {activeTab === 'platform' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                  <input
                    type="text"
                    value={config.platform.name}
                    onChange={(e) => updateConfig('platform', 'name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                  <input
                    type="text"
                    value={config.platform.tagline}
                    onChange={(e) => updateConfig('platform', 'tagline', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={config.platform.description}
                    onChange={(e) => updateConfig('platform', 'description', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                  <input
                    type="email"
                    value={config.platform.supportEmail}
                    onChange={(e) => updateConfig('platform', 'supportEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Phone</label>
                  <input
                    type="tel"
                    value={config.platform.supportPhone}
                    onChange={(e) => updateConfig('platform', 'supportPhone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                  <input
                    type="url"
                    value={config.platform.website}
                    onChange={(e) => updateConfig('platform', 'website', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={config.platform.timezone}
                    onChange={(e) => updateConfig('platform', 'timezone', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Currency</label>
                  <select
                    value={config.platform.currency}
                    onChange={(e) => updateConfig('platform', 'currency', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                  <select
                    value={config.platform.language}
                    onChange={(e) => updateConfig('platform', 'language', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Branding</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                  <input
                    type="url"
                    value={config.platform.logo}
                    onChange={(e) => updateConfig('platform', 'logo', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                  <input
                    type="url"
                    value={config.platform.favicon}
                    onChange={(e) => updateConfig('platform', 'favicon', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={config.platform.primaryColor}
                      onChange={(e) => updateConfig('platform', 'primaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.platform.primaryColor}
                      onChange={(e) => updateConfig('platform', 'primaryColor', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={config.platform.secondaryColor}
                      onChange={(e) => updateConfig('platform', 'secondaryColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.platform.secondaryColor}
                      onChange={(e) => updateConfig('platform', 'secondaryColor', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'features' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Feature Toggles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(config.features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {key === 'userRegistration' && 'Allow new user registrations'}
                      {key === 'emailVerification' && 'Require email verification for new accounts'}
                      {key === 'phoneVerification' && 'Require phone verification'}
                      {key === 'twoFactorAuth' && 'Enable two-factor authentication'}
                      {key === 'socialLogin' && 'Allow social media login (Google, Facebook)'}
                      {key === 'guestCheckout' && 'Allow guest checkout without registration'}
                      {key === 'multiCurrency' && 'Support multiple currencies'}
                      {key === 'multiLanguage' && 'Support multiple languages'}
                      {key === 'darkMode' && 'Enable dark mode theme'}
                      {key === 'maintenance' && 'Put platform in maintenance mode'}
                    </p>
                  </div>
                  <button
                    onClick={() => updateConfig('features', key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Password Policy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Password Length</label>
                  <input
                    type="number"
                    min="6"
                    max="50"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Password Requirements</h4>
                <div className="space-y-3">
                  {[
                    { key: 'passwordRequireSpecial', label: 'Require special characters' },
                    { key: 'passwordRequireNumbers', label: 'Require numbers' },
                    { key: 'passwordRequireUppercase', label: 'Require uppercase letters' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.security[key]}
                        onChange={(e) => updateConfig('security', key, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Rate Limiting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.security.enableRateLimit}
                      onChange={(e) => updateConfig('security', 'enableRateLimit', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable Rate Limiting</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.security.enableCaptcha}
                      onChange={(e) => updateConfig('security', 'enableCaptcha', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enable CAPTCHA</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requests per Window</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={config.security.rateLimitRequests}
                    onChange={(e) => updateConfig('security', 'rateLimitRequests', parseInt(e.target.value))}
                    disabled={!config.security.enableRateLimit}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Window Duration (seconds)</label>
                  <input
                    type="number"
                    min="30"
                    max="3600"
                    value={config.security.rateLimitWindow}
                    onChange={(e) => updateConfig('security', 'rateLimitWindow', parseInt(e.target.value))}
                    disabled={!config.security.enableRateLimit}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">IP Whitelist</h3>
              <div className="space-y-4">
                {config.security.ipWhitelist.map((ip, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={ip}
                      readOnly
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    />
                    <button
                      onClick={() => removeFromArray('security', 'ipWhitelist', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Enter IP address (e.g., 192.168.1.1)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addToArray('security', 'ipWhitelist', e.target.value)
                        e.target.value = ''
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling
                      addToArray('security', 'ipWhitelist', input.value)
                      input.value = ''
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-8">
            {/* Email Configuration */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <EnvelopeIcon className="w-6 h-6 mr-2" />
                Email Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
                  <select
                    value={config.email.provider}
                    onChange={(e) => updateConfig('email', 'provider', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>
                
                {config.email.provider === 'smtp' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                      <input
                        type="text"
                        value={config.email.smtpHost}
                        onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                      <input
                        type="number"
                        value={config.email.smtpPort}
                        onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Username</label>
                      <input
                        type="text"
                        value={config.email.smtpUser}
                        onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Password</label>
                      <div className="relative">
                        <input
                          type={showSecrets['smtpPassword'] ? 'text' : 'password'}
                          value={config.email.smtpPassword}
                          onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecret('smtpPassword')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showSecrets['smtpPassword'] ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                  <input
                    type="email"
                    value={config.email.fromEmail}
                    onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                  <input
                    type="text"
                    value={config.email.fromName}
                    onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Configuration */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BanknotesIcon className="w-6 h-6 mr-2" />
                Payment Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={config.payment.razorpayKeyId}
                    onChange={(e) => updateConfig('payment', 'razorpayKeyId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Razorpay Key Secret</label>
                  <div className="relative">
                    <input
                      type={showSecrets['razorpaySecret'] ? 'text' : 'password'}
                      value={config.payment.razorpayKeySecret}
                      onChange={(e) => updateConfig('payment', 'razorpayKeySecret', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('razorpaySecret')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showSecrets['razorpaySecret'] ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={config.payment.taxRate}
                    onChange={(e) => updateConfig('payment', 'taxRate', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Processing Fee (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={config.payment.processingFee}
                    onChange={(e) => updateConfig('payment', 'processingFee', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Payment Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'enableCOD', label: 'Cash on Delivery' },
                    { key: 'enableUPI', label: 'UPI Payments' },
                    { key: 'enableWallet', label: 'Digital Wallets' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={config.payment[key]}
                        onChange={(e) => updateConfig('payment', key, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Storage Configuration */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <PhotoIcon className="w-6 h-6 mr-2" />
                File Storage Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage Provider</label>
                  <select
                    value={config.storage.provider}
                    onChange={(e) => updateConfig('storage', 'provider', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="local">Local Storage</option>
                    <option value="aws_s3">Amazon S3</option>
                    <option value="cloudinary">Cloudinary</option>
                    <option value="google_cloud">Google Cloud Storage</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.storage.maxFileSize}
                    onChange={(e) => updateConfig('storage', 'maxFileSize', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {config.storage.provider === 'aws_s3' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">AWS S3 Bucket</label>
                      <input
                        type="text"
                        value={config.storage.awsBucket}
                        onChange={(e) => updateConfig('storage', 'awsBucket', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">AWS Region</label>
                      <select
                        value={config.storage.awsRegion}
                        onChange={(e) => updateConfig('storage', 'awsRegion', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">Europe (Ireland)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4">Allowed File Types</h4>
                <div className="flex flex-wrap gap-2">
                  {config.storage.allowedFileTypes.map((type, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {type}
                      <button
                        onClick={() => removeFromArray('storage', 'allowedFileTypes', index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}