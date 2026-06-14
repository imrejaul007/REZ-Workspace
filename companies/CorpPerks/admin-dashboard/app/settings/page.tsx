'use client';

import { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Users,
  Building2,
  Mail,
  Clock,
  Globe,
  Lock,
  Key,
  Save,
  RefreshCw,
  Check,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import { Card, Badge, Button, Input, Select, Tabs } from '@/components/ui';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'modules', label: 'Modules' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization&apos;s system configuration
          </p>
        </div>
        <Button size="sm" icon={<Save className="h-4 w-4" />}>
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Organization Info */}
          <Card
            title="Organization"
            subtitle="Basic information about your organization"
            action={
              <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />}>
                Edit
              </Button>
            }
          >
            <div className="space-y-4">
              <Input
                label="Organization Name"
                defaultValue="CorpPerks"
                icon={<Building2 className="h-4 w-4" />}
              />
              <Input
                label="Industry"
                defaultValue="Human Resources / HRMS"
                icon={<Globe className="h-4 w-4" />}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Founded Year"
                  defaultValue="2020"
                  type="number"
                />
                <Input
                  label="Company Size"
                  defaultValue="100-500"
                />
              </div>
              <Input
                label="Website"
                defaultValue="https://corpperks.com"
                type="url"
              />
            </div>
          </Card>

          {/* Location & Timezone */}
          <Card
            title="Location & Timezone"
            subtitle="Regional settings for your organization"
          >
            <div className="space-y-4">
              <Select
                label="Country"
                options={[
                  { value: 'IN', label: 'India' },
                  { value: 'US', label: 'United States' },
                  { value: 'UK', label: 'United Kingdom' },
                  { value: 'SG', label: 'Singapore' },
                ]}
                defaultValue="IN"
              />
              <Select
                label="Timezone"
                options={[
                  { value: 'IST', label: 'India Standard Time (IST)' },
                  { value: 'PST', label: 'Pacific Standard Time (PST)' },
                  { value: 'EST', label: 'Eastern Standard Time (EST)' },
                  { value: 'GMT', label: 'Greenwich Mean Time (GMT)' },
                ]}
                defaultValue="IST"
              />
              <Select
                label="Date Format"
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                ]}
                defaultValue="DD/MM/YYYY"
              />
              <Select
                label="Currency"
                options={[
                  { value: 'INR', label: 'Indian Rupee (INR)' },
                  { value: 'USD', label: 'US Dollar (USD)' },
                  { value: 'EUR', label: 'Euro (EUR)' },
                  { value: 'GBP', label: 'British Pound (GBP)' },
                ]}
                defaultValue="INR"
              />
            </div>
          </Card>

          {/* Working Hours */}
          <Card
            title="Working Hours"
            subtitle="Standard work schedule for your organization"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  defaultValue="09:00"
                />
                <Input
                  label="End Time"
                  type="time"
                  defaultValue="18:00"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Work Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <button
                      key={day}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                        ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day)
                          ? 'border-primary-300 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500'
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Leave Policy Defaults */}
          <Card
            title="Leave Policy"
            subtitle="Default leave entitlements for employees"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Casual Leave</p>
                  <p className="text-xs text-gray-500">Annual entitlement</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">15</span>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Sick Leave</p>
                  <p className="text-xs text-gray-500">Annual entitlement</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">12</span>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    +
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Earned Leave</p>
                  <p className="text-xs text-gray-500">Annual entitlement</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">18</span>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                    +
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card title="Email Notifications" subtitle="Configure email alerts">
            <div className="space-y-4">
              <NotificationToggle
                title="New Employee Onboarding"
                description="Get notified when a new employee joins"
                defaultEnabled={true}
              />
              <NotificationToggle
                title="Leave Requests"
                description="Notify managers about pending leave requests"
                defaultEnabled={true}
              />
              <NotificationToggle
                title="Payroll Updates"
                description="Receive alerts for payroll processing status"
                defaultEnabled={true}
              />
              <NotificationToggle
                title="Performance Reviews"
                description="Reminder for upcoming reviews and submissions"
                defaultEnabled={true}
              />
              <NotificationToggle
                title="System Alerts"
                description="Critical system notifications and updates"
                defaultEnabled={true}
              />
            </div>
          </Card>

          <Card title="Push Notifications" subtitle="Mobile app push notification settings">
            <div className="space-y-4">
              <NotificationToggle
                title="Daily Summary"
                description="Daily digest of team activities"
                defaultEnabled={true}
              />
              <NotificationToggle
                title="Urgent Alerts"
                description="Critical updates requiring immediate attention"
                defaultEnabled={true}
              />
              <NotificationToggle
                title="Weekly Reports"
                description="Weekly analytics summary"
                defaultEnabled={false}
              />
            </div>
          </Card>

          <Card title="Reminder Schedule" subtitle="Automated reminder timing">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Leave Request Reminder"
                options={[
                  { value: '1d', label: '1 day before' },
                  { value: '3d', label: '3 days before' },
                  { value: '7d', label: '1 week before' },
                ]}
                defaultValue="3d"
              />
              <Select
                label="Performance Review Reminder"
                options={[
                  { value: '1w', label: '1 week before' },
                  { value: '2w', label: '2 weeks before' },
                  { value: '1m', label: '1 month before' },
                ]}
                defaultValue="2w"
              />
            </div>
          </Card>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Authentication" subtitle="Login and session settings">
            <div className="space-y-4">
              <Select
                label="Login Method"
                options={[
                  { value: 'password', label: 'Password Only' },
                  { value: 'otp', label: 'Password + OTP' },
                  { value: 'mfa', label: 'Multi-Factor Auth' },
                  { value: 'sso', label: 'SSO Only' },
                ]}
                defaultValue="otp"
              />
              <Select
                label="Session Timeout"
                options={[
                  { value: '30m', label: '30 minutes' },
                  { value: '1h', label: '1 hour' },
                  { value: '4h', label: '4 hours' },
                  { value: '8h', label: '8 hours' },
                  { value: '24h', label: '24 hours' },
                ]}
                defaultValue="4h"
              />
              <Select
                label="Password Expiry"
                options={[
                  { value: '30d', label: '30 days' },
                  { value: '90d', label: '90 days' },
                  { value: '180d', label: '180 days' },
                  { value: 'never', label: 'Never' },
                ]}
                defaultValue="90d"
              />
              <NotificationToggle
                title="Allow Multiple Sessions"
                description="Allow users to log in from multiple devices"
                defaultEnabled={true}
              />
            </div>
          </Card>

          <Card title="Access Control" subtitle="Role and permission settings">
            <div className="space-y-4">
              <Select
                label="Default Admin Role"
                options={[
                  { value: 'super_admin', label: 'Super Admin' },
                  { value: 'hr_admin', label: 'HR Admin' },
                  { value: 'manager', label: 'Manager' },
                ]}
                defaultValue="hr_admin"
              />
              <NotificationToggle
                title="IP Restriction"
                description="Limit access to specific IP addresses"
                defaultEnabled={false}
              />
              <NotificationToggle
                title="Audit All Admin Actions"
                description="Log all administrative changes"
                defaultEnabled={true}
              />
            </div>
          </Card>

          <Card title="API Security" subtitle="API access and keys">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">API Key</p>
                  <p className="text-xs text-gray-500">Production API access</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">
                    cp_live_xxxxxxxxxxxxx
                  </span>
                  <Button variant="ghost" size="sm" icon={<RefreshCw className="h-4 w-4" />}>
                    Rotate
                  </Button>
                </div>
              </div>
              <Select
                label="API Rate Limit"
                options={[
                  { value: '100', label: '100 requests/min' },
                  { value: '500', label: '500 requests/min' },
                  { value: '1000', label: '1000 requests/min' },
                  { value: 'unlimited', label: 'Unlimited' },
                ]}
                defaultValue="500"
              />
            </div>
          </Card>

          <Card title="Data Protection" subtitle="Encryption and backup settings">
            <div className="space-y-4">
              <Select
                label="Data Retention"
                options={[
                  { value: '1y', label: '1 year' },
                  { value: '3y', label: '3 years' },
                  { value: '5y', label: '5 years' },
                  { value: '7y', label: '7 years (legal)' },
                ]}
                defaultValue="7y"
              />
              <Select
                label="Backup Frequency"
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
                defaultValue="daily"
              />
              <NotificationToggle
                title="End-to-End Encryption"
                description="Encrypt sensitive employee data at rest"
                defaultEnabled={true}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Integrations Settings */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <IntegrationCard
            name="RABTUL Auth"
            description="Authentication and user management"
            status="connected"
            icon={<Lock className="h-6 w-6" />}
          />
          <IntegrationCard
            name="RABTUL Wallet"
            description="Payment and wallet services"
            status="connected"
            icon={<Key className="h-6 w-6" />}
          />
          <IntegrationCard
            name="REZ Intelligence"
            description="AI and ML predictions"
            status="connected"
            icon={<Shield className="h-6 w-6" />}
          />
          <IntegrationCard
            name="Slack"
            description="Team communication"
            status="disconnected"
            icon={<Users className="h-6 w-6" />}
          />
          <IntegrationCard
            name="Microsoft Teams"
            description="Enterprise communication"
            status="disconnected"
            icon={<Users className="h-6 w-6" />}
          />
          <IntegrationCard
            name="Google Workspace"
            description="Email and calendar"
            status="disconnected"
            icon={<Mail className="h-6 w-6" />}
          />
        </div>
      )}

      {/* Modules Settings */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ModuleCard
              name="Payroll"
              description="Salary processing and tax management"
              enabled={true}
              required
            />
            <ModuleCard
              name="Attendance"
              description="Time tracking and geo-fencing"
              enabled={true}
              required
            />
            <ModuleCard
              name="Leave Management"
              description="Leave requests and approvals"
              enabled={true}
              required
            />
            <ModuleCard
              name="Performance Reviews"
              description="OKRs, 360 feedback, and ratings"
              enabled={true}
              required={false}
            />
            <ModuleCard
              name="Training & LMS"
              description="Courses, certifications, and tracks"
              enabled={true}
              required={false}
            />
            <ModuleCard
              name="Documents"
              description="E-signatures and document management"
              enabled={true}
              required={false}
            />
            <ModuleCard
              name="Onboarding"
              description="New hire workflows and tasks"
              enabled={false}
              required={false}
            />
            <ModuleCard
              name="Exit Management"
              description="Offboarding and exit interviews"
              enabled={false}
              required={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Notification Toggle Component
function NotificationToggle({
  title,
  description,
  defaultEnabled = false,
}: {
  title: string;
  description: string;
  defaultEnabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
      <div>
        <p className="text-sm font-medium text-gray-700">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          enabled ? 'bg-primary-500' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            enabled ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

// Integration Card Component
function IntegrationCard({
  name,
  description,
  status,
  icon,
}: {
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
            <Badge
              variant={status === 'connected' ? 'success' : 'default'}
              size="sm"
            >
              {status === 'connected' ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
          <div className="mt-3">
            {status === 'connected' ? (
              <Button variant="outline" size="sm">
                Configure
              </Button>
            ) : (
              <Button size="sm">Connect</Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Module Card Component
function ModuleCard({
  name,
  description,
  enabled,
  required,
}: {
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            enabled ? 'bg-success-50 text-success-500' : 'bg-gray-100 text-gray-400'
          )}
        >
          <Check className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{name}</h3>
            {required && (
              <Badge variant="warning" size="sm">
                Required
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <button
        disabled={required}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          enabled ? 'bg-primary-500' : 'bg-gray-200',
          required && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            enabled ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}
