'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  UsersIcon,
  PaintBrushIcon,
  KeyIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface SettingSection {
  id: string
  title: string
  description: string
  icon: any
  settings: Setting[]
}

interface Setting {
  key: string
  label: string
  description: string
  type: 'boolean' | 'text' | 'number' | 'select'
  value: any
  options?: { label: string; value: any }[]
  required?: boolean
}

const platformSettings: SettingSection[] = [
  {
    id: 'general',
    title: 'General Settings',
    description: 'Basic platform configuration and preferences',
    icon: CogIcon,
    settings: [
      {
        key: 'platform_name',
        label: 'Platform Name',
        description: 'The name of your restaurant platform',
        type: 'text',
        value: 'Resturistan',
        required: true
      },
      {
        key: 'maintenance_mode',
        label: 'Maintenance Mode',
        description: 'Enable maintenance mode to temporarily disable public access',
        type: 'boolean',
        value: false
      },
      {
        key: 'registration_enabled',
        label: 'User Registration',
        description: 'Allow new users to register on the platform',
        type: 'boolean',
        value: true
      },
      {
        key: 'default_language',
        label: 'Default Language',
        description: 'Default language for new users',
        type: 'select',
        value: 'en',
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' }
        ]
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Security settings and privacy controls',
    icon: ShieldCheckIcon,
    settings: [
      {
        key: 'two_factor_required',
        label: 'Require 2FA for Admins',
        description: 'Require two-factor authentication for all admin accounts',
        type: 'boolean',
        value: true
      },
      {
        key: 'password_min_length',
        label: 'Minimum Password Length',
        description: 'Minimum number of characters required for passwords',
        type: 'number',
        value: 8
      },
      {
        key: 'session_timeout',
        label: 'Session Timeout (minutes)',
        description: 'Automatically log out users after period of inactivity',
        type: 'number',
        value: 120
      },
      {
        key: 'ip_whitelist_enabled',
        label: 'IP Whitelist',
        description: 'Restrict admin access to specific IP addresses',
        type: 'boolean',
        value: false
      }
    ]
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure system notifications and alerts',
    icon: BellIcon,
    settings: [
      {
        key: 'email_notifications',
        label: 'Email Notifications',
        description: 'Send email notifications for important events',
        type: 'boolean',
        value: true
      },
      {
        key: 'admin_alerts',
        label: 'Admin Alerts',
        description: 'Send alerts to admins for critical system events',
        type: 'boolean',
        value: true
      },
      {
        key: 'user_welcome_email',
        label: 'Welcome Emails',
        description: 'Send welcome emails to new users',
        type: 'boolean',
        value: true
      },
      {
        key: 'notification_frequency',
        label: 'Notification Frequency',
        description: 'How often to send digest notifications',
        type: 'select',
        value: 'daily',
        options: [
          { label: 'Real-time', value: 'realtime' },
          { label: 'Hourly', value: 'hourly' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' }
        ]
      }
    ]
  },
  {
    id: 'payments',
    title: 'Payment Settings',
    description: 'Configure payment processing and fees',
    icon: CurrencyDollarIcon,
    settings: [
      {
        key: 'commission_rate',
        label: 'Platform Commission Rate (%)',
        description: 'Percentage commission charged on each order',
        type: 'number',
        value: 15
      },
      {
        key: 'minimum_payout',
        label: 'Minimum Payout Amount',
        description: 'Minimum amount before payouts are processed',
        type: 'number',
        value: 50
      },
      {
        key: 'payment_processing_enabled',
        label: 'Payment Processing',
        description: 'Enable payment processing through the platform',
        type: 'boolean',
        value: true
      },
      {
        key: 'currency',
        label: 'Default Currency',
        description: 'Default currency for transactions',
        type: 'select',
        value: 'USD',
        options: [
          { label: 'US Dollar (USD)', value: 'USD' },
          { label: 'Euro (EUR)', value: 'EUR' },
          { label: 'British Pound (GBP)', value: 'GBP' },
          { label: 'Canadian Dollar (CAD)', value: 'CAD' }
        ]
      }
    ]
  },
  {
    id: 'features',
    title: 'Feature Control',
    description: 'Enable or disable platform features',
    icon: UsersIcon,
    settings: [
      {
        key: 'job_board_enabled',
        label: 'Job Board',
        description: 'Enable job posting and application features',
        type: 'boolean',
        value: true
      },
      {
        key: 'marketplace_enabled',
        label: 'Marketplace',
        description: 'Enable supplier marketplace features',
        type: 'boolean',
        value: true
      },
      {
        key: 'community_enabled',
        label: 'Community Features',
        description: 'Enable community posts and discussions',
        type: 'boolean',
        value: true
      },
      {
        key: 'reviews_enabled',
        label: 'Reviews & Ratings',
        description: 'Allow customers to leave reviews and ratings',
        type: 'boolean',
        value: true
      }
    ]
  }
]

export default function AdminSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingSection[]>(platformSettings)
  const [activeSection, setActiveSection] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  const updateSetting = (sectionId: string, settingKey: string, value: any) => {
    setSettings(prevSettings => 
      prevSettings.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              settings: section.settings.map(setting => 
                setting.key === settingKey ? { ...setting, value } : setting
              )
            }
          : section
      )
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setSaving(false)
    setHasChanges(false)
    
    // Show success message
    alert('Settings saved successfully!')
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings(platformSettings)
      setHasChanges(false)
    }
  }

  const activeSettings = settings.find(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
              <p className="text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Sidebar */}
          <aside className="lg:col-span-3 mb-8 lg:mb-0">
            <nav className="space-y-2">
              {settings.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-left ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {section.title}
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-9">
            {/* Save bar */}
            {hasChanges && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">You have unsaved changes</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="text-sm text-yellow-700 hover:text-yellow-800"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Settings section */}
            {activeSettings && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <activeSettings.icon className="w-6 h-6 text-gray-400 mr-3" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{activeSettings.title}</h2>
                      <p className="text-sm text-gray-600">{activeSettings.description}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {activeSettings.settings.map((setting) => (
                    <div key={setting.key} className="flex items-start justify-between">
                      <div className="flex-1 mr-6">
                        <label className="block text-sm font-medium text-gray-900">
                          {setting.label}
                          {setting.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {setting.type === 'boolean' ? (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={setting.value}
                              onChange={(e) => updateSetting(activeSettings.id, setting.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        ) : setting.type === 'select' ? (
                          <select
                            value={setting.value}
                            onChange={(e) => updateSetting(activeSettings.id, setting.key, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {setting.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : setting.type === 'number' ? (
                          <input
                            type="number"
                            value={setting.value}
                            onChange={(e) => updateSetting(activeSettings.id, setting.key, parseInt(e.target.value))}
                            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <input
                            type="text"
                            value={setting.value}
                            onChange={(e) => updateSetting(activeSettings.id, setting.key, e.target.value)}
                            className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={setting.required}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow-sm mt-8 border border-red-200">
              <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                    <p className="text-sm text-red-700">Irreversible and destructive actions</p>
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Reset All Settings</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      This will reset all platform settings to their default values. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                  >
                    Reset All Settings
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}