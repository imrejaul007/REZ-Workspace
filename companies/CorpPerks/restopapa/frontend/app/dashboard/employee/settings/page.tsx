'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface NotificationSettings {
  emailNotifications: {
    jobAlerts: boolean
    applicationUpdates: boolean
    messages: boolean
    trainingReminders: boolean
    systemUpdates: boolean
  }
  pushNotifications: {
    jobAlerts: boolean
    applicationUpdates: boolean
    messages: boolean
    trainingReminders: boolean
    systemUpdates: boolean
  }
  frequency: 'immediately' | 'daily' | 'weekly'
}

interface PrivacySettings {
  profileVisibility: 'public' | 'employers_only' | 'private'
  showContactInfo: boolean
  showWorkHistory: boolean
  showSkills: boolean
  allowDirectContact: boolean
  showOnlineStatus: boolean
}

interface AccountSettings {
  language: string
  timezone: string
  currency: string
  theme: 'light' | 'dark' | 'auto'
}

export default function EmployeeSettings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('notifications')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: {
      jobAlerts: true,
      applicationUpdates: true,
      messages: true,
      trainingReminders: true,
      systemUpdates: false
    },
    pushNotifications: {
      jobAlerts: true,
      applicationUpdates: true,
      messages: false,
      trainingReminders: true,
      systemUpdates: false
    },
    frequency: 'immediately'
  })

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'employers_only',
    showContactInfo: true,
    showWorkHistory: true,
    showSkills: true,
    allowDirectContact: true,
    showOnlineStatus: false
  })

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    language: 'en',
    timezone: 'America/New_York',
    currency: 'USD',
    theme: 'light'
  })

  const updateNotificationSetting = (category: 'emailNotifications' | 'pushNotifications', key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const updatePrivacySetting = (key: keyof PrivacySettings, value: any) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateAccountSetting = (key: keyof AccountSettings, value: any) => {
    setAccountSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = () => {
    // Simulate API call
    logger.info('Saving settings...', {
      notificationSettings,
      privacySettings,
      accountSettings
    })
    
    // Show success message (you could use a toast here)
    alert('Settings saved successfully!')
  }

  const handleDeleteAccount = () => {
    // This would typically involve an API call and proper authentication
    logger.info('Account deletion requested')
    setShowDeleteConfirm(false)
    alert('Account deletion request submitted. You will receive an email with further instructions.')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account preferences and privacy settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <nav className="space-y-2">
                {[
                  { id: 'notifications', label: 'Notifications', icon: BellIcon },
                  { id: 'privacy', label: 'Privacy', icon: ShieldCheckIcon },
                  { id: 'account', label: 'Account', icon: CogIcon },
                  { id: 'security', label: 'Security', icon: LockClosedIcon }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-6">
                    <BellIcon className="w-6 h-6 text-gray-400 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                  </div>

                  <div className="space-y-8">
                    {/* Email Notifications */}
                    <div>
                      <div className="flex items-center mb-4">
                        <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(notificationSettings.emailNotifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {key === 'jobAlerts' && 'Get notified about new job opportunities that match your preferences'}
                                {key === 'applicationUpdates' && 'Updates on your job applications and interview schedules'}
                                {key === 'messages' && 'Direct messages from employers and recruiters'}
                                {key === 'trainingReminders' && 'Reminders about course deadlines and new training opportunities'}
                                {key === 'systemUpdates' && 'Platform updates and maintenance notifications'}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => updateNotificationSetting('emailNotifications', key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Push Notifications */}
                    <div>
                      <div className="flex items-center mb-4">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(notificationSettings.pushNotifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </p>
                              <p className="text-sm text-gray-500">
                                Instant notifications on your device
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => updateNotificationSetting('pushNotifications', key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notification Frequency */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Frequency</h3>
                      <div className="space-y-2">
                        {[
                          { value: 'immediately', label: 'Immediately', desc: 'Get notifications as soon as they happen' },
                          { value: 'daily', label: 'Daily digest', desc: 'Receive a daily summary of notifications' },
                          { value: 'weekly', label: 'Weekly digest', desc: 'Receive a weekly summary of notifications' }
                        ].map(option => (
                          <label key={option.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="frequency"
                              value={option.value}
                              checked={notificationSettings.frequency === option.value}
                              onChange={(e) => setNotificationSettings(prev => ({ ...prev, frequency: e.target.value as any }))}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{option.label}</p>
                              <p className="text-sm text-gray-500">{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-6">
                    <ShieldCheckIcon className="w-6 h-6 text-gray-400 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Privacy Settings</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Profile Visibility */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
                      <div className="space-y-2">
                        {[
                          { value: 'public', label: 'Public', desc: 'Your profile is visible to everyone' },
                          { value: 'employers_only', label: 'Employers Only', desc: 'Only verified employers can see your profile' },
                          { value: 'private', label: 'Private', desc: 'Your profile is not visible in searches' }
                        ].map(option => (
                          <label key={option.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name="profileVisibility"
                              value={option.value}
                              checked={privacySettings.profileVisibility === option.value}
                              onChange={(e) => updatePrivacySetting('profileVisibility', e.target.value)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{option.label}</p>
                              <p className="text-sm text-gray-500">{option.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Information Sharing */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Information Sharing</h3>
                      <div className="space-y-4">
                        {[
                          { key: 'showContactInfo', label: 'Show contact information', desc: 'Allow employers to see your phone and email' },
                          { key: 'showWorkHistory', label: 'Show work history', desc: 'Display your employment history in your profile' },
                          { key: 'showSkills', label: 'Show skills and certifications', desc: 'Display your skills and certification details' },
                          { key: 'allowDirectContact', label: 'Allow direct contact', desc: 'Let employers contact you directly through the platform' },
                          { key: 'showOnlineStatus', label: 'Show online status', desc: 'Let others see when you are online' }
                        ].map(setting => (
                          <div key={setting.key} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-700">{setting.label}</p>
                              <p className="text-sm text-gray-500">{setting.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={privacySettings[setting.key as keyof PrivacySettings] as boolean}
                                onChange={(e) => updatePrivacySetting(setting.key as keyof PrivacySettings, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-6">
                    <CogIcon className="w-6 h-6 text-gray-400 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={accountSettings.language}
                        onChange={(e) => updateAccountSetting('language', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={accountSettings.timezone}
                        onChange={(e) => updateAccountSetting('timezone', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={accountSettings.currency}
                        onChange={(e) => updateAccountSetting('currency', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                        <option value="CAD">Canadian Dollar (CAD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={accountSettings.theme}
                        onChange={(e) => updateAccountSetting('theme', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                  <div className="flex items-center mb-4">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Danger Zone</h2>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
                    <p className="text-red-700 text-sm mb-4">
                      Once you delete your account, there is no going back. All your data, applications, 
                      and profile information will be permanently deleted.
                    </p>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center mb-6">
                    <LockClosedIcon className="w-6 h-6 text-gray-400 mr-3" />
                    <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Password</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Last updated: March 1, 2024
                      </p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Change Password
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Add an extra layer of security to your account
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-red-600 text-sm">Not enabled</span>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Enable 2FA
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Active Sessions</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Manage devices that are signed into your account
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <DevicePhoneMobileIcon className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                              <p className="font-medium text-gray-900">Current Device</p>
                              <p className="text-sm text-gray-500">Chrome on Mac • Miami, FL</p>
                            </div>
                          </div>
                          <span className="text-green-600 text-sm">Active now</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Login History</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Review recent login activity
                      </p>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                        View Login History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">Confirm Account Deletion</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you absolutely sure you want to delete your account? This action cannot be undone 
                and all your data will be permanently deleted.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}