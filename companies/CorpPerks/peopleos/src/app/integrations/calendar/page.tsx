'use client';

import { useState, useEffect } from 'react';

// Types
interface CalendarConnection {
  connectionId: string;
  provider: 'google' | 'outlook' | 'apple' | 'corpperks';
  email: string;
  calendarName?: string;
  isPrimary: boolean;
  isActive: boolean;
  lastSyncedAt?: string;
}

interface CalendarEvent {
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  provider: string;
}

// Mock data for demo
const mockConnections: CalendarConnection[] = [
  {
    connectionId: '1',
    provider: 'google',
    email: 'john.doe@company.com',
    calendarName: 'Primary Calendar',
    isPrimary: true,
    isActive: true,
    lastSyncedAt: new Date().toISOString(),
  },
  {
    connectionId: '2',
    provider: 'outlook',
    email: 'john.doe@company.com',
    calendarName: 'Work Calendar',
    isPrimary: false,
    isActive: true,
    lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockEvents: CalendarEvent[] = [
  {
    eventId: '1',
    title: 'Team Standup',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 3900000).toISOString(),
    status: 'confirmed',
    provider: 'google',
  },
  {
    eventId: '2',
    title: '1:1 with Manager',
    startTime: new Date(Date.now() + 7200000).toISOString(),
    endTime: new Date(Date.now() + 8100000).toISOString(),
    status: 'confirmed',
    provider: 'outlook',
  },
  {
    eventId: '3',
    title: 'Project Review',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 90000000).toISOString(),
    status: 'tentative',
    provider: 'google',
  },
];

export default function CalendarIntegrationPage() {
  const [connections, setConnections] = useState<CalendarConnection[]>(mockConnections);
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'events' | 'settings'>('connections');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook'>('google');

  // Connect calendar
  const handleConnect = async (provider: 'google' | 'outlook') => {
    setLoading(true);
    try {
      // In production, this would redirect to OAuth flow
      const authUrl = provider === 'google'
        ? `${process.env.NEXT_PUBLIC_CALENDAR_SERVICE_URL || 'http://localhost:4736'}/api/calendar/auth/google?userId=user1&companyId=company1`
        : `${process.env.NEXT_PUBLIC_CALENDAR_SERVICE_URL || 'http://localhost:4736'}/api/calendar/auth/microsoft?userId=user1&companyId=company1`;

      // Simulate connection for demo
      setTimeout(() => {
        const newConnection: CalendarConnection = {
          connectionId: Date.now().toString(),
          provider,
          email: `demo@${provider}.com`,
          calendarName: provider === 'google' ? 'Google Calendar' : 'Outlook Calendar',
          isPrimary: connections.length === 0,
          isActive: true,
          lastSyncedAt: new Date().toISOString(),
        };
        setConnections([...connections, newConnection]);
        setLoading(false);
        setShowConnectModal(false);
      }, 1500);
    } catch (error) {
      logger.error('Failed to connect calendar:', error);
      setLoading(false);
    }
  };

  // Disconnect calendar
  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) return;

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnections(connections.filter(c => c.connectionId !== connectionId));
    } catch (error) {
      logger.error('Failed to disconnect calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync calendar
  const handleSync = async (connectionId: string) => {
    setSyncing(true);
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnections(connections.map(c =>
        c.connectionId === connectionId
          ? { ...c, lastSyncedAt: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      logger.error('Failed to sync calendar:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        );
      case 'outlook':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.236.575a.802.802 0 0 1-.577.234H.652c-.23 0-.423-.08-.574-.234a.802.802 0 0 1-.235-.575V7.387c0-.23.08-.424.235-.575A.802.802 0 0 1 .652 6.6h22.696a.802.802 0 0 1 .577.212c.156.15.235.346.235.575z"/>
            <path fill="#0078D4" d="M10.892 12.957l5.913 4.044 5.913-4.044-5.913-4.044-5.913 4.044z"/>
            <path fill="#FFF" d="M24 7.387v10.478c0 .23-.08.424-.236.575a.802.802 0 0 1-.577.234H.652c-.23 0-.423-.08-.574-.234a.802.802 0 0 1-.235-.575V7.387c0-.23.08-.424.235-.575A.802.802 0 0 1 .652 6.6h22.696a.802.802 0 0 1 .577.212c.156.15.235.346.235.575z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar Integration</h1>
            <p className="text-gray-600 mt-1">
              Sync your calendars and manage meetings across platforms
            </p>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Connect Calendar</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{connections.length}</div>
          <div className="text-sm text-gray-500">Connected</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{connections.filter(c => c.isActive).length}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">{events.length}</div>
          <div className="text-sm text-gray-500">Events Synced</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">
            {connections.length > 0
              ? new Date(connections[0].lastSyncedAt || 0).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '--'}
          </div>
          <div className="text-sm text-gray-500">Last Synced</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('connections')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'connections'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Connections
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="p-6">
            {connections.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No calendars connected</h3>
                <p className="text-gray-500 mb-4">Connect your first calendar to get started</p>
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Connect Calendar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div
                    key={connection.connectionId}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          {getProviderIcon(connection.provider)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 capitalize">
                              {connection.provider} Calendar
                            </h3>
                            {connection.isPrimary && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{connection.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Last synced: {connection.lastSyncedAt
                              ? new Date(connection.lastSyncedAt).toLocaleTimeString()
                              : 'Never'}
                          </div>
                          <div className={`text-xs ${connection.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {connection.isActive ? 'Connected' : 'Disconnected'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleSync(connection.connectionId)}
                            disabled={syncing}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sync"
                          >
                            <svg className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDisconnect(connection.connectionId)}
                            disabled={loading}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Disconnect"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="p-6">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500">Connect a calendar to see your events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.eventId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        {getProviderIcon(event.provider)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{formatDate(event.startTime)}</span>
                          <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-4">Sync Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Auto-sync</div>
                      <div className="text-sm text-gray-500">Automatically sync calendars every 15 minutes</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Sync Private Events</div>
                      <div className="text-sm text-gray-500">Include private events in sync</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Create CorpPerks Events</div>
                      <div className="text-sm text-gray-500">Auto-create events for meetings</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Meeting Reminders</div>
                      <div className="text-sm text-gray-500">Get reminded before meetings</div>
                    </div>
                    <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option>15 minutes before</option>
                      <option>30 minutes before</option>
                      <option>1 hour before</option>
                      <option>1 day before</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Connect Calendar</h2>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleConnect('google')}
                  disabled={loading}
                  className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <div className="bg-white p-2 rounded-lg">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Google Calendar</div>
                    <div className="text-sm text-gray-500">Sync with Google Calendar</div>
                  </div>
                  {loading && selectedProvider === 'google' && (
                    <svg className="w-5 h-5 ml-auto animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleConnect('outlook')}
                  disabled={loading}
                  className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <div className="bg-white p-2 rounded-lg">
                    <svg className="w-8 h-8" viewBox="0 0 24 24">
                      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.236.575a.802.802 0 0 1-.577.234H.652c-.23 0-.423-.08-.574-.234a.802.802 0 0 1-.235-.575V7.387c0-.23.08-.424.235-.575A.802.802 0 0 1 .652 6.6h22.696a.802.802 0 0 1 .577.212c.156.15.235.346.235.575z"/>
                      <path fill="#FFF" d="M10.892 12.957l5.913 4.044 5.913-4.044-5.913-4.044-5.913 4.044z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Microsoft Outlook</div>
                    <div className="text-sm text-gray-500">Sync with Outlook Calendar</div>
                  </div>
                  {loading && selectedProvider === 'outlook' && (
                    <svg className="w-5 h-5 ml-auto animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-6 text-center">
                By connecting, you agree to allow PeopleOS to sync your calendar data.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
