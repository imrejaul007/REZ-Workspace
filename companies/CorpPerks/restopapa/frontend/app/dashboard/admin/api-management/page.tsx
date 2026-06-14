'use client'

import { useState } from 'react'
import { randomUUID } from 'crypto';
import {
  KeyIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  CogIcon,
  GlobeAltIcon,
  LockClosedIcon,
  BoltIcon,
  ArrowPathIcon,
  XMarkIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  PhotoIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface ApiKey {
  id: string
  name: string
  key: string
  description: string
  permissions: string[]
  rateLimit: number
  status: 'active' | 'inactive' | 'revoked'
  environment: 'development' | 'staging' | 'production'
  lastUsed: string
  totalRequests: number
  createdAt: string
  expiresAt?: string
  ipRestrictions: string[]
  allowedOrigins: string[]
}

interface Integration {
  id: string
  name: string
  type: 'payment' | 'sms' | 'email' | 'storage' | 'analytics' | 'social'
  status: 'connected' | 'disconnected' | 'error' | 'configuring'
  description: string
  version: string
  lastSync: string
  config: Record<string, any>
  webhookUrl?: string
  healthStatus: 'healthy' | 'degraded' | 'down'
}

const mockApiKeys: ApiKey[] = [
  {
    id: 'ak_001',
    name: 'Production API Key',
    key: 'rk_live_123abc456def789ghi012jkl345mno',
    description: 'Main production API key for restaurant operations',
    permissions: ['restaurants:read', 'restaurants:write', 'orders:read', 'jobs:read'],
    rateLimit: 1000,
    status: 'active',
    environment: 'production',
    lastUsed: '2025-01-15T14:30:00Z',
    totalRequests: 45678,
    createdAt: '2024-12-01T10:00:00Z',
    expiresAt: '2025-12-01T10:00:00Z',
    ipRestrictions: ['203.0.113.1', '203.0.113.2'],
    allowedOrigins: ['https://api.resturistan.com', 'https://app.resturistan.com']
  },
  {
    id: 'ak_002',
    name: 'Mobile App API',
    key: 'rk_test_456def789ghi012jkl345mno678pqr',
    description: 'API key for mobile application integration',
    permissions: ['users:read', 'jobs:read', 'marketplace:read'],
    rateLimit: 500,
    status: 'active',
    environment: 'production',
    lastUsed: '2025-01-15T12:15:00Z',
    totalRequests: 23456,
    createdAt: '2025-01-01T09:00:00Z',
    ipRestrictions: [],
    allowedOrigins: ['https://mobile.resturistan.com']
  },
  {
    id: 'ak_003',
    name: 'Development Key',
    key: 'rk_dev_789ghi012jkl345mno678pqr901stu',
    description: 'Development environment API key',
    permissions: ['*'],
    rateLimit: 100,
    status: 'active',
    environment: 'development',
    lastUsed: '2025-01-14T16:45:00Z',
    totalRequests: 1234,
    createdAt: '2024-11-15T14:00:00Z',
    ipRestrictions: ['127.0.0.1'],
    allowedOrigins: ['http://localhost:3000']
  }
]

const mockIntegrations: Integration[] = [
  {
    id: 'int_001',
    name: 'Razorpay',
    type: 'payment',
    status: 'connected',
    description: 'Payment gateway for processing transactions',
    version: 'v2.1.0',
    lastSync: '2025-01-15T14:00:00Z',
    healthStatus: 'healthy',
    config: {
      keyId: 'rzp_live_***',
      keySecret: '***',
      webhook: 'enabled'
    }
  },
  {
    id: 'int_002',
    name: 'Twilio SMS',
    type: 'sms',
    status: 'connected',
    description: 'SMS service for OTP and notifications',
    version: 'v1.3.2',
    lastSync: '2025-01-15T13:30:00Z',
    healthStatus: 'healthy',
    config: {
      accountSid: 'AC***',
      authToken: '***',
      fromNumber: '+91***'
    }
  },
  {
    id: 'int_003',
    name: 'SendGrid',
    type: 'email',
    status: 'error',
    description: 'Email delivery service',
    version: 'v3.0.1',
    lastSync: '2025-01-14T10:15:00Z',
    healthStatus: 'down',
    config: {
      apiKey: 'SG.***',
      fromEmail: 'noreply@resturistan.com'
    }
  },
  {
    id: 'int_004',
    name: 'AWS S3',
    type: 'storage',
    status: 'connected',
    description: 'File storage and CDN',
    version: 'v2.0.0',
    lastSync: '2025-01-15T14:15:00Z',
    healthStatus: 'healthy',
    config: {
      bucket: 'resturistan-storage',
      region: 'ap-south-1'
    }
  },
  {
    id: 'int_005',
    name: 'Google Analytics',
    type: 'analytics',
    status: 'connected',
    description: 'Web analytics and tracking',
    version: 'GA4',
    lastSync: '2025-01-15T14:30:00Z',
    healthStatus: 'healthy',
    config: {
      trackingId: 'G-***',
      measurementId: '***'
    }
  }
]

export default function ApiManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(mockApiKeys)
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations)
  const [activeTab, setActiveTab] = useState('api-keys')
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'connected': case 'healthy': return 'bg-green-100 text-green-800'
      case 'inactive': case 'disconnected': case 'degraded': return 'bg-yellow-100 text-yellow-800'
      case 'revoked': case 'error': case 'down': return 'bg-red-100 text-red-800'
      case 'configuring': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-red-100 text-red-800'
      case 'staging': return 'bg-yellow-100 text-yellow-800'
      case 'development': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return BanknotesIcon
      case 'sms': return DevicePhoneMobileIcon
      case 'email': return EnvelopeIcon
      case 'storage': return PhotoIcon
      case 'analytics': return ChartBarIcon
      case 'social': return UserGroupIcon
      default: return CogIcon
    }
  }

  const toggleSecret = (fieldName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Show toast notification
    } catch (err) {
      logger.error('Failed to copy text: ', err)
    }
  }

  const revokeApiKey = (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, status: 'revoked' as const } : key
      ))
    }
  }

  const regenerateApiKey = (keyId: string) => {
    if (confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
      const newKey = `rk_${randomUUID().replace(/-/g, '')}`
      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, key: newKey } : key
      ))
    }
  }

  const testIntegration = async (integrationId: string) => {
    // Simulate API test
    logger.info('Testing integration:', integrationId)
    // Show loading state and then result
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Management</h1>
            <p className="text-gray-600 mt-2">Manage API keys, integrations, and external services</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <DocumentDuplicateIcon className="w-5 h-5" />
              <span>API Documentation</span>
            </button>
            <button
              onClick={() => setShowCreateKeyModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create API Key</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'api-keys', name: 'API Keys', icon: KeyIcon },
              { id: 'integrations', name: 'Integrations', icon: GlobeAltIcon },
              { id: 'webhooks', name: 'Webhooks', icon: BoltIcon },
              { id: 'usage', name: 'Usage & Analytics', icon: ChartBarIcon }
            ].map((tab) => (
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

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-8">
            {/* API Keys Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <KeyIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total API Keys</p>
                    <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Keys</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {apiKeys.filter(k => k.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ChartBarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {apiKeys.reduce((sum, key) => sum + key.totalRequests, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rate Limit</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(...apiKeys.map(k => k.rateLimit))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* API Keys Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API Key
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Environment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apiKeys.map((apiKey) => (
                      <tr key={apiKey.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-gray-900">{apiKey.name}</div>
                              <button
                                onClick={() => copyToClipboard(apiKey.key)}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy API Key"
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-sm text-gray-500 font-mono">
                              {showSecrets[apiKey.id] ? apiKey.key : `${apiKey.key.substring(0, 12)}...`}
                              <button
                                onClick={() => toggleSecret(apiKey.id)}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                              >
                                {showSecrets[apiKey.id] ? (
                                  <EyeSlashIcon className="w-4 h-4 inline" />
                                ) : (
                                  <EyeIcon className="w-4 h-4 inline" />
                                )}
                              </button>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{apiKey.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEnvironmentColor(apiKey.environment)}`}>
                            {apiKey.environment}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(apiKey.status)}`}>
                            {apiKey.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {apiKey.totalRequests.toLocaleString()} requests
                          </div>
                          <div className="text-xs text-gray-500">
                            Rate limit: {apiKey.rateLimit}/min
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(apiKey.lastUsed).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => setSelectedKey(apiKey)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => regenerateApiKey(apiKey.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Regenerate Key"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => revokeApiKey(apiKey.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Revoke Key"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-8">
            {/* Integration Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GlobeAltIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                    <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Connected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {integrations.filter(i => i.status === 'connected').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Healthy</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {integrations.filter(i => i.healthStatus === 'healthy').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Issues</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {integrations.filter(i => i.status === 'error' || i.healthStatus === 'down').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Integrations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => {
                const TypeIcon = getTypeIcon(integration.type)
                return (
                  <div key={integration.id} className="bg-white rounded-lg shadow-sm p-6 border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <TypeIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{integration.name}</h3>
                          <p className="text-sm text-gray-500">{integration.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(integration.status)}`}>
                          {integration.status}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          integration.healthStatus === 'healthy' ? 'bg-green-500' :
                          integration.healthStatus === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Version:</span>
                        <span className="font-medium">{integration.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Sync:</span>
                        <span className="font-medium">{new Date(integration.lastSync).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => testIntegration(integration.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Test Connection
                      </button>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-600 hover:text-gray-800">
                          <CogIcon className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-800">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Available Integrations */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Available Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Stripe', type: 'payment', description: 'Payment processing' },
                  { name: 'PayPal', type: 'payment', description: 'Global payments' },
                  { name: 'Mailchimp', type: 'email', description: 'Email marketing' },
                  { name: 'Slack', type: 'social', description: 'Team communication' },
                  { name: 'Google Drive', type: 'storage', description: 'Cloud storage' },
                  { name: 'Zapier', type: 'automation', description: 'Workflow automation' },
                  { name: 'WhatsApp Business', type: 'sms', description: 'Business messaging' },
                  { name: 'Firebase', type: 'analytics', description: 'App analytics' }
                ].map((service) => (
                  <div key={service.name} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-500 mb-3">{service.description}</p>
                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Webhook Endpoints</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Add Webhook
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  {
                    url: 'https://api.resturistan.com/webhooks/payments',
                    events: ['payment.success', 'payment.failed'],
                    status: 'active',
                    lastDelivery: '2025-01-15T14:30:00Z'
                  },
                  {
                    url: 'https://api.resturistan.com/webhooks/users',
                    events: ['user.created', 'user.updated'],
                    status: 'active',
                    lastDelivery: '2025-01-15T12:15:00Z'
                  },
                  {
                    url: 'https://api.resturistan.com/webhooks/orders',
                    events: ['order.created', 'order.completed'],
                    status: 'inactive',
                    lastDelivery: '2025-01-14T09:45:00Z'
                  }
                ].map((webhook, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <BoltIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900 font-mono text-sm">{webhook.url}</p>
                          <p className="text-sm text-gray-500">
                            Events: {webhook.events.join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(webhook.status)}`}>
                          {webhook.status}
                        </span>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <CogIcon className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Last delivery: {new Date(webhook.lastDelivery).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usage & Analytics Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">API Usage Analytics</h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">API Usage Chart Placeholder</p>
                  <p className="text-sm text-gray-400 mt-2">Integrate with Chart.js for detailed analytics</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top API Endpoints</h3>
                <div className="space-y-3">
                  {[
                    { endpoint: '/api/v1/restaurants', calls: 12543, percentage: 35 },
                    { endpoint: '/api/v1/jobs', calls: 8976, percentage: 25 },
                    { endpoint: '/api/v1/users', calls: 6234, percentage: 17 },
                    { endpoint: '/api/v1/orders', calls: 4567, percentage: 13 },
                    { endpoint: '/api/v1/payments', calls: 3456, percentage: 10 }
                  ].map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm text-gray-900">{endpoint.endpoint}</p>
                        <p className="text-sm text-gray-500">{endpoint.calls.toLocaleString()} calls</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${endpoint.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12">{endpoint.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Rates</h3>
                <div className="space-y-4">
                  {[
                    { code: '200 OK', count: 45123, color: 'bg-green-500' },
                    { code: '400 Bad Request', count: 1234, color: 'bg-yellow-500' },
                    { code: '401 Unauthorized', count: 567, color: 'bg-orange-500' },
                    { code: '500 Internal Error', count: 89, color: 'bg-red-500' }
                  ].map((error, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${error.color}`} />
                        <span className="text-sm text-gray-900">{error.code}</span>
                      </div>
                      <span className="text-sm text-gray-600">{error.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create API Key Modal */}
      {showCreateKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New API Key</h3>
              <button
                onClick={() => setShowCreateKeyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                <input
                  type="text"
                  placeholder="e.g., Mobile App API Key"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Describe what this API key will be used for..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate Limit (per minute)</label>
                  <input
                    type="number"
                    placeholder="100"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {[
                    'users:read', 'users:write', 'restaurants:read', 'restaurants:write',
                    'jobs:read', 'jobs:write', 'orders:read', 'orders:write',
                    'payments:read', 'marketplace:read', 'analytics:read'
                  ].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateKeyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}