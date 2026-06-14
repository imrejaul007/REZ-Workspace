'use client';

import { useState } from 'react';

// Types
interface SSOConfiguration {
  configId: string;
  provider: 'google' | 'microsoft' | 'saml' | 'ldap';
  status: 'active' | 'inactive' | 'pending_verification' | 'error';
  isDefault: boolean;
  securitySettings: {
    enforceSSO: boolean;
    allowPasswordLogin: boolean;
    sessionTimeout: number;
    requireMFA: boolean;
  };
  lastVerifiedAt?: string;
  createdAt: string;
}

interface SSOLog {
  logId: string;
  action: string;
  status: string;
  userId?: string;
  timestamp: string;
  ipAddress?: string;
}

// Mock data for demo
const mockConfigurations: SSOConfiguration[] = [
  {
    configId: '1',
    provider: 'google',
    status: 'active',
    isDefault: true,
    securitySettings: {
      enforceSSO: false,
      allowPasswordLogin: true,
      sessionTimeout: 480,
      requireMFA: false,
    },
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    configId: '2',
    provider: 'microsoft',
    status: 'pending_verification',
    isDefault: false,
    securitySettings: {
      enforceSSO: false,
      allowPasswordLogin: true,
      sessionTimeout: 480,
      requireMFA: false,
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockLogs: SSOLog[] = [
  { logId: '1', action: 'login_success', status: 'success', userId: 'user1', timestamp: new Date().toISOString(), ipAddress: '192.168.1.1' },
  { logId: '2', action: 'login_failure', status: 'failure', timestamp: new Date(Date.now() - 300000).toISOString(), ipAddress: '10.0.0.1' },
  { logId: '3', action: 'config_verified', status: 'success', userId: 'admin1', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { logId: '4', action: 'user_provisioned', status: 'success', userId: 'user2', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { logId: '5', action: 'logout', status: 'success', userId: 'user1', timestamp: new Date(Date.now() - 10800000).toISOString() },
];

const providerDetails = {
  google: {
    name: 'Google Workspace',
    description: 'Authenticate using Google Workspace accounts',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    color: 'bg-red-50 border-red-200',
    textColor: 'text-red-600',
  },
  microsoft: {
    name: 'Microsoft Azure AD',
    description: 'Authenticate using Azure Active Directory',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#00A4EF" d="M11.4 24H0V12.6h11.4V24z"/>
        <path fill="#FFB900" d="M24 24H12.6V12.6H24V24z"/>
        <path fill="#F25022" d="M11.4 11.4H0V0h11.4v11.4z"/>
        <path fill="#7FBA00" d="M24 11.4H12.6V0H24v11.4z"/>
      </svg>
    ),
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-600',
  },
  saml: {
    name: 'SAML 2.0',
    description: 'Enterprise SSO with any SAML 2.0 Identity Provider',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-600',
  },
  ldap: {
    name: 'LDAP / Active Directory',
    description: 'Authenticate using on-premise LDAP or AD servers',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    color: 'bg-green-50 border-green-200',
    textColor: 'text-green-600',
  },
};

export default function SSOIntegrationPage() {
  const [configurations, setConfigurations] = useState<SSOConfiguration[]>(mockConfigurations);
  const [logs, setLogs] = useState<SSOLog[]>(mockLogs);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'providers' | 'logs' | 'settings'>('providers');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'microsoft' | 'saml' | 'ldap'>('google');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Configure SSO provider
  const handleConfigure = async (provider: 'google' | 'microsoft' | 'saml' | 'ldap') => {
    setLoading(true);
    try {
      // In production, this would initiate OAuth flow or open config modal
      const authUrl = provider === 'google'
        ? `${process.env.NEXT_PUBLIC_SSO_SERVICE_URL || 'http://localhost:4737'}/api/sso/auth/google?companyId=company1`
        : provider === 'microsoft'
        ? `${process.env.NEXT_PUBLIC_SSO_SERVICE_URL || 'http://localhost:4737'}/api/sso/auth/microsoft?companyId=company1`
        : null;

      if (authUrl) {
        // window.location.href = authUrl;
      }

      // Simulate configuration
      setTimeout(() => {
        setConfigurations(prev => [...prev, {
          configId: Date.now().toString(),
          provider,
          status: 'pending_verification',
          isDefault: prev.length === 0,
          securitySettings: {
            enforceSSO: false,
            allowPasswordLogin: true,
            sessionTimeout: 480,
            requireMFA: false,
          },
          createdAt: new Date().toISOString(),
        }]);
        setLoading(false);
        setShowConfigModal(false);
      }, 1500);
    } catch (error) {
      logger.error('Failed to configure SSO:', error);
      setLoading(false);
    }
  };

  // Test SSO configuration
  const handleTest = async (configId: string) => {
    setLoading(true);
    try {
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfigurations(prev => prev.map(c =>
        c.configId === configId
          ? { ...c, status: 'active', lastVerifiedAt: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      logger.error('Failed to test SSO:', error);
    } finally {
      setLoading(false);
    }
  };

  // Disable SSO
  const handleDisable = async (configId: string) => {
    if (!confirm('Are you sure you want to disable this SSO configuration?')) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConfigurations(prev => prev.map(c =>
        c.configId === configId ? { ...c, status: 'inactive' } : c
      ));
    } catch (error) {
      logger.error('Failed to disable SSO:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: SSOConfiguration['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>;
      case 'inactive':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Inactive</span>;
      case 'pending_verification':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Error</span>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get action label
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login_success: 'Successful Login',
      login_failure: 'Failed Login',
      logout: 'User Logout',
      config_verified: 'Config Verified',
      user_provisioned: 'User Provisioned',
      user_deprovisioned: 'User Deprovisioned',
      token_refresh: 'Token Refresh',
    };
    return labels[action] || action;
  };

  // Filter logs
  const filteredLogs = filterStatus === 'all'
    ? logs
    : logs.filter(log => log.status === filterStatus);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SSO Integration</h1>
            <p className="text-gray-600 mt-1">
              Configure Single Sign-On for your organization
            </p>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Provider</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{configurations.length}</div>
          <div className="text-sm text-gray-500">Providers</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{configurations.filter(c => c.status === 'active').length}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{logs.filter(l => l.action.includes('login') && l.status === 'success').length}</div>
          <div className="text-sm text-gray-500">Logins Today</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{logs.filter(l => l.status === 'failure').length}</div>
          <div className="text-sm text-gray-500">Failed Attempts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'providers'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Providers
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'logs'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Activity Logs
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Global Settings
            </button>
          </nav>
        </div>

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="p-6">
            {configurations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No SSO providers configured</h3>
                <p className="text-gray-500 mb-4">Add your first SSO provider to get started</p>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Add Provider
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {configurations.map((config) => {
                  const provider = providerDetails[config.provider];
                  return (
                    <div
                      key={config.configId}
                      className={`border rounded-lg p-6 ${provider.color}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            {provider.icon}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                              {getStatusBadge(config.status)}
                              {config.isDefault && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Configured: {formatDate(config.createdAt)}</span>
                              {config.lastVerifiedAt && (
                                <span>Verified: {formatDate(config.lastVerifiedAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {config.status === 'pending_verification' && (
                            <button
                              onClick={() => handleTest(config.configId)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              Verify & Activate
                            </button>
                          )}
                          {config.status === 'active' && (
                            <>
                              <button
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDisable(config.configId)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-white border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50"
                              >
                                Disable
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Security Settings Preview */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Session Timeout</div>
                            <div className="text-sm font-medium">{config.securitySettings.sessionTimeout} min</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Password Login</div>
                            <div className="text-sm font-medium">
                              {config.securitySettings.allowPasswordLogin ? 'Allowed' : 'Disabled'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Enforce SSO</div>
                            <div className="text-sm font-medium">
                              {config.securitySettings.enforceSSO ? 'Yes' : 'No'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Require MFA</div>
                            <div className="text-sm font-medium">
                              {config.securitySettings.requireMFA ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Recent Activity</h3>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">All Events</option>
                <option value="success">Successful</option>
                <option value="failure">Failed</option>
              </select>
            </div>
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.logId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        log.status === 'success' ? 'text-green-600' : 'text-red-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {log.status === 'success' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        )}
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{getActionLabel(log.action)}</div>
                      <div className="text-sm text-gray-500">
                        {log.userId && <span>User: {log.userId}</span>}
                        {log.ipAddress && <span> IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{formatDate(log.timestamp)}</div>
                    <div>{formatTime(log.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Global Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Enforce SSO</div>
                      <div className="text-sm text-gray-500">Require all users to login via SSO</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Allow Password Login</div>
                      <div className="text-sm text-gray-500">Allow users to login with password when SSO is unavailable</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Session Timeout</div>
                      <div className="text-sm text-gray-500">Auto-logout after inactivity</div>
                    </div>
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="60">1 hour</option>
                      <option value="240">4 hours</option>
                      <option value="480" selected>8 hours</option>
                      <option value="1440">24 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">User Provisioning</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Auto-Provision Users</div>
                      <div className="text-sm text-gray-500">Automatically create accounts for new SSO users</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Sync Groups</div>
                      <div className="text-sm text-gray-500">Sync user groups from SSO provider</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add SSO Provider</h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {(Object.keys(providerDetails) as Array<keyof typeof providerDetails>).map((provider) => {
                  const details = providerDetails[provider];
                  const isConfigured = configurations.some(c => c.provider === provider);

                  return (
                    <button
                      key={provider}
                      onClick={() => !isConfigured && handleConfigure(provider)}
                      disabled={isConfigured || loading}
                      className={`w-full flex items-center space-x-4 p-4 border rounded-lg transition-all ${
                        isConfigured
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
                          : details.color + ' hover:shadow-md cursor-pointer'
                      }`}
                    >
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        {details.icon}
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{details.name}</span>
                          {isConfigured && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                              Configured
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{details.description}</p>
                      </div>
                      {!isConfigured && (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Need help configuring?</p>
                    <p className="mt-1">
                      Each provider has specific setup requirements. Contact your IT administrator for assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
