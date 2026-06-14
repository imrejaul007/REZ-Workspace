'use client';

import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { 
  CogIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  KeyIcon,
  ServerIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  BanknotesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface Setting {
  id: string;
  category: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'email' | 'password';
  value;
  options?: string[];
  required?: boolean;
  sensitive?: boolean;
}

const systemSettings: Setting[] = [
  // General Settings
  {
    id: 'site_name',
    category: 'General',
    name: 'Site Name',
    description: 'The name of your platform displayed across the site',
    type: 'text',
    value: 'RestoPapa',
    required: true,
  },
  {
    id: 'site_description',
    category: 'General',
    name: 'Site Description',
    description: 'Brief description of your platform',
    type: 'textarea',
    value: 'Comprehensive restaurant management and food marketplace platform',
  },
  {
    id: 'admin_email',
    category: 'General',
    name: 'Admin Email',
    description: 'Primary admin email for system notifications',
    type: 'email',
    value: 'admin@restauranthub.com',
    required: true,
  },
  {
    id: 'default_currency',
    category: 'General',
    name: 'Default Currency',
    description: 'Default currency for the platform',
    type: 'select',
    value: 'INR',
    options: ['INR', 'USD', 'EUR', 'GBP'],
    required: true,
  },
  {
    id: 'timezone',
    category: 'General',
    name: 'Default Timezone',
    description: 'Default timezone for the platform',
    type: 'select',
    value: 'Asia/Kolkata',
    options: ['Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Tokyo'],
    required: true,
  },
  
  // Email Settings
  {
    id: 'smtp_host',
    category: 'Email',
    name: 'SMTP Host',
    description: 'SMTP server hostname',
    type: 'text',
    value: 'smtp.gmail.com',
    required: true,
  },
  {
    id: 'smtp_port',
    category: 'Email',
    name: 'SMTP Port',
    description: 'SMTP server port',
    type: 'number',
    value: 587,
    required: true,
  },
  {
    id: 'smtp_username',
    category: 'Email',
    name: 'SMTP Username',
    description: 'SMTP authentication username',
    type: 'email',
    value: 'noreply@restauranthub.com',
    required: true,
  },
  {
    id: 'smtp_password',
    category: 'Email',
    name: 'SMTP Password',
    description: 'SMTP authentication password',
    type: 'password',
    value: '••••••••••••',
    required: true,
    sensitive: true,
  },
  {
    id: 'email_from_name',
    category: 'Email',
    name: 'From Name',
    description: 'Name shown in outgoing emails',
    type: 'text',
    value: 'RestoPapa',
    required: true,
  },
  
  // SMS Settings
  {
    id: 'sms_provider',
    category: 'SMS',
    name: 'SMS Provider',
    description: 'SMS service provider',
    type: 'select',
    value: 'twilio',
    options: ['twilio', 'aws_sns', 'msg91', 'textlocal'],
    required: true,
  },
  {
    id: 'sms_api_key',
    category: 'SMS',
    name: 'API Key',
    description: 'SMS provider API key',
    type: 'password',
    value: '••••••••••••',
    required: true,
    sensitive: true,
  },
  {
    id: 'sms_sender_id',
    category: 'SMS',
    name: 'Sender ID',
    description: 'SMS sender identifier',
    type: 'text',
    value: 'RESTHUB',
    required: true,
  },
  
  // Payment Settings
  {
    id: 'stripe_publishable_key',
    category: 'Payment',
    name: 'Stripe Publishable Key',
    description: 'Stripe public API key',
    type: 'text',
    value: 'pk_test_••••••••••••',
    required: true,
  },
  {
    id: 'stripe_secret_key',
    category: 'Payment',
    name: 'Stripe Secret Key',
    description: 'Stripe secret API key',
    type: 'password',
    value: 'sk_test_••••••••••••',
    required: true,
    sensitive: true,
  },
  {
    id: 'razorpay_key_id',
    category: 'Payment',
    name: 'Razorpay Key ID',
    description: 'Razorpay public key ID',
    type: 'text',
    value: 'rzp_test_••••••••••••',
    required: true,
  },
  {
    id: 'razorpay_key_secret',
    category: 'Payment',
    name: 'Razorpay Secret Key',
    description: 'Razorpay secret key',
    type: 'password',
    value: '••••••••••••',
    required: true,
    sensitive: true,
  },
  
  // Security Settings
  {
    id: 'jwt_secret',
    category: 'Security',
    name: 'JWT Secret',
    description: 'JSON Web Token signing secret',
    type: 'password',
    value: '••••••••••••',
    required: true,
    sensitive: true,
  },
  {
    id: 'session_timeout',
    category: 'Security',
    name: 'Session Timeout',
    description: 'Session timeout in minutes',
    type: 'number',
    value: 30,
    required: true,
  },
  {
    id: 'max_login_attempts',
    category: 'Security',
    name: 'Max Login Attempts',
    description: 'Maximum failed login attempts before account lockout',
    type: 'number',
    value: 5,
    required: true,
  },
  {
    id: 'enable_2fa',
    category: 'Security',
    name: 'Enable Two-Factor Authentication',
    description: 'Require 2FA for admin accounts',
    type: 'boolean',
    value: true,
  },
  
  // API Settings
  {
    id: 'rate_limit_requests',
    category: 'API',
    name: 'Rate Limit - Requests',
    description: 'Maximum API requests per minute per IP',
    type: 'number',
    value: 100,
    required: true,
  },
  {
    id: 'api_version',
    category: 'API',
    name: 'API Version',
    description: 'Current API version',
    type: 'select',
    value: 'v1',
    options: ['v1', 'v2'],
    required: true,
  },
  {
    id: 'cors_origins',
    category: 'API',
    name: 'CORS Origins',
    description: 'Allowed CORS origins (comma-separated)',
    type: 'textarea',
    value: 'http://localhost:3000,https://restauranthub.com',
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>(systemSettings);
  const [activeCategory, setActiveCategory] = useState('General');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = [...new Set(settings.map(s => s.category))];

  const handleSettingChange = (settingId: string, value) => {
    setSettings(prev => prev.map(setting => 
      setting.id === settingId ? { ...setting, value } : setting
    ));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSaving(false);
    setHasChanges(false);
    
    // Show success message
    alert('Settings saved successfully!');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'General':
        return CogIcon;
      case 'Email':
        return EnvelopeIcon;
      case 'SMS':
        return DevicePhoneMobileIcon;
      case 'Payment':
        return BanknotesIcon;
      case 'Security':
        return ShieldCheckIcon;
      case 'API':
        return ServerIcon;
      default:
        return CogIcon;
    }
  };

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <Input
            type={setting.type}
            value={setting.value}
            placeholder={setting.description}
            required={setting.required}
            readOnly
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value}
            placeholder={setting.description}
            required={setting.required}
            readOnly
          />
        );
      
      case 'textarea':
        return (
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            value={setting.value}
            placeholder={setting.description}
            required={setting.required}
            readOnly
          />
        );
      
      case 'select':
        return (
          <Select
            value={setting.value}
            onValueChange={(value) => value}
            required={setting.required}
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={setting.value}
              onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Enabled</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  const filteredSettings = settings.filter(s => s.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform settings and integrations</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {hasChanges && (
            <Badge color="yellow">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          
          <Button
            onClick={handleSaveSettings}
            disabled={!hasChanges || saving}
            className="flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <nav className="space-y-2">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category);
                const settingsInCategory = settings.filter(s => s.category === category);
                const changedSettings = settingsInCategory.filter(s => s.value !== systemSettings.find(ss => ss.id === s.id)?.value);
                
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
                      activeCategory === category
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{category}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">{settingsInCategory.length}</span>
                      {changedSettings.length > 0 && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              {React.createElement(getCategoryIcon(activeCategory), { className: "w-5 h-5 text-gray-500" })}
              <h3 className="text-lg font-semibold text-gray-900">{activeCategory} Settings</h3>
            </div>
            
            <div className="space-y-6">
              {filteredSettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-900">
                      {setting.name}
                      {setting.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {setting.sensitive && (
                      <Badge color="red" >
                        <KeyIcon className="w-3 h-3 mr-1" />
                        Sensitive
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">{setting.description}</p>
                  
                  <div className="max-w-md">
                    {renderSettingInput(setting)}
                  </div>
                  
                  {setting.sensitive && (
                    <div className="flex items-center space-x-1 text-xs text-amber-600">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      <span>This is a sensitive configuration. Changes require admin approval.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ServerIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Database Status</p>
              <p className="font-semibold text-green-600">Connected</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EnvelopeIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Email Service</p>
              <p className="font-semibold text-blue-600">Active</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CloudArrowUpIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">File Storage</p>
              <p className="font-semibold text-purple-600">Connected</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Documentation */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <DocumentTextIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Configuration Help</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Environment Variables</h4>
            <p className="text-gray-600 mb-2">
              Many settings can also be configured using environment variables for better security in production.
            </p>
            <ul className="text-gray-600 space-y-1">
              <li>• SMTP settings: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS</li>
              <li>• Payment: STRIPE_SECRET_KEY, RAZORPAY_KEY_SECRET</li>
              <li>• Security: JWT_SECRET, SESSION_TIMEOUT</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Security Best Practices</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Use environment variables for sensitive data</li>
              <li>• Enable two-factor authentication for admin accounts</li>
              <li>• Regularly rotate API keys and secrets</li>
              <li>• Monitor failed login attempts</li>
              <li>• Keep API rate limits reasonable</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}