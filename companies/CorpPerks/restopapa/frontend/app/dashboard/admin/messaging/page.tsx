'use client';

import React, { useState } from 'react';
import { 
  PaperAirplaneIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  UserGroupIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Message {
  id: string;
  title: string;
  content: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  recipients: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  createdBy: string;
  targetAudience: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  category: 'marketing' | 'transactional' | 'alert' | 'reminder';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed?: string;
}

interface MessageAudience {
  id: string;
  name: string;
  description: string;
  criteria: string;
  userCount: number;
  lastUpdated: string;
}

const MessagingPage = () => {
  const [activeTab, setActiveTab] = useState<'messages' | 'templates' | 'audiences' | 'analytics'>('messages');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [messages] = useState<Message[]>([
    {
      id: '1',
      title: 'Welcome New Restaurant Partners',
      content: 'Welcome to RestuRistan! We\'re excited to have you join our platform...',
      type: 'email',
      status: 'sent',
      recipients: 250,
      deliveredCount: 248,
      openedCount: 180,
      clickedCount: 45,
      createdAt: '2024-01-15T09:00:00Z',
      sentAt: '2024-01-15T10:00:00Z',
      createdBy: 'Marketing Team',
      targetAudience: 'New Restaurants (Last 7 Days)'
    },
    {
      id: '2',
      title: 'System Maintenance Alert',
      content: 'We will be performing scheduled maintenance on January 20th from 2-4 AM EST...',
      type: 'push',
      status: 'scheduled',
      recipients: 15000,
      deliveredCount: 0,
      openedCount: 0,
      clickedCount: 0,
      createdAt: '2024-01-14T16:30:00Z',
      scheduledAt: '2024-01-19T20:00:00Z',
      createdBy: 'Operations Team',
      targetAudience: 'All Active Users'
    },
    {
      id: '3',
      title: 'Job Application Received',
      content: 'You have received a new job application for {{jobTitle}} position...',
      type: 'in-app',
      status: 'sent',
      recipients: 85,
      deliveredCount: 85,
      openedCount: 72,
      clickedCount: 38,
      createdAt: '2024-01-15T14:20:00Z',
      sentAt: '2024-01-15T14:25:00Z',
      createdBy: 'System',
      targetAudience: 'Restaurant Owners with Active Jobs'
    },
    {
      id: '4',
      title: 'Payment Reminder',
      content: 'Your subscription payment of $99 is due in 3 days...',
      type: 'sms',
      status: 'failed',
      recipients: 120,
      deliveredCount: 85,
      openedCount: 0,
      clickedCount: 0,
      createdAt: '2024-01-15T11:15:00Z',
      sentAt: '2024-01-15T11:20:00Z',
      createdBy: 'Billing System',
      targetAudience: 'Subscription Due Soon'
    }
  ]);

  const [templates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Welcome Email - New Restaurant',
      type: 'email',
      category: 'marketing',
      subject: 'Welcome to RestuRistan, {{restaurantName}}!',
      content: 'Dear {{ownerName}}, Welcome to RestuRistan! We\'re excited to help {{restaurantName}} grow...',
      variables: ['restaurantName', 'ownerName', 'setupUrl'],
      isActive: true,
      usageCount: 45,
      lastUsed: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Job Application Received',
      type: 'in-app',
      category: 'transactional',
      content: 'New application received for {{jobTitle}} from {{applicantName}}',
      variables: ['jobTitle', 'applicantName', 'applicationUrl'],
      isActive: true,
      usageCount: 324,
      lastUsed: '2024-01-15T14:25:00Z'
    },
    {
      id: '3',
      name: 'Order Status Update',
      type: 'push',
      category: 'transactional',
      content: 'Your order #{{orderNumber}} is now {{status}}',
      variables: ['orderNumber', 'status', 'trackingUrl'],
      isActive: true,
      usageCount: 1250,
      lastUsed: '2024-01-15T16:45:00Z'
    },
    {
      id: '4',
      name: 'Payment Failed Alert',
      type: 'sms',
      category: 'alert',
      content: 'Payment failed for {{amount}}. Please update your payment method at {{updateUrl}}',
      variables: ['amount', 'updateUrl', 'retryUrl'],
      isActive: true,
      usageCount: 67,
      lastUsed: '2024-01-14T09:30:00Z'
    },
    {
      id: '5',
      name: 'Weekly Performance Report',
      type: 'email',
      category: 'reminder',
      subject: 'Your weekly performance summary - {{restaurantName}}',
      content: 'Here\'s how {{restaurantName}} performed this week: {{stats}}',
      variables: ['restaurantName', 'stats', 'improvementTips'],
      isActive: false,
      usageCount: 12,
      lastUsed: '2024-01-08T08:00:00Z'
    }
  ]);

  const [audiences] = useState<MessageAudience[]>([
    {
      id: '1',
      name: 'New Restaurants (Last 7 Days)',
      description: 'Restaurant owners who joined in the past week',
      criteria: 'userType = restaurant AND registrationDate >= 7 days ago',
      userCount: 25,
      lastUpdated: '2024-01-15T12:00:00Z'
    },
    {
      id: '2',
      name: 'High-Volume Restaurants',
      description: 'Restaurants with >100 orders per month',
      criteria: 'userType = restaurant AND monthlyOrders >= 100',
      userCount: 150,
      lastUpdated: '2024-01-15T08:00:00Z'
    },
    {
      id: '3',
      name: 'Active Job Seekers',
      description: 'Employees who applied to jobs in last 30 days',
      criteria: 'userType = employee AND lastApplication <= 30 days ago',
      userCount: 850,
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: '4',
      name: 'Subscription Due Soon',
      description: 'Users with subscriptions expiring in next 7 days',
      criteria: 'subscriptionExpiry <= 7 days AND status = active',
      userCount: 120,
      lastUpdated: '2024-01-15T06:00:00Z'
    },
    {
      id: '5',
      name: 'Inactive Users (30+ Days)',
      description: 'Users who haven\'t logged in for over 30 days',
      criteria: 'lastLogin >= 30 days ago AND status = active',
      userCount: 2350,
      lastUpdated: '2024-01-15T07:00:00Z'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <EnvelopeIcon className="w-5 h-5" />;
      case 'sms': return <DevicePhoneMobileIcon className="w-5 h-5" />;
      case 'push': return <BellIcon className="w-5 h-5" />;
      case 'in-app': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed': return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      case 'scheduled': return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'draft': return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
      default: return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getCategoryBadge = (category: string) => {
    const badges = {
      marketing: 'bg-purple-100 text-purple-800',
      transactional: 'bg-blue-100 text-blue-800',
      alert: 'bg-red-100 text-red-800',
      reminder: 'bg-yellow-100 text-yellow-800'
    };
    return badges[category as keyof typeof badges] || badges.transactional;
  };

  const handleSendMessage = (id: string) => {
    logger.info('Sending message:', id);
  };

  const handleEditMessage = (id: string) => {
    logger.info('Editing message:', id);
  };

  const handleUseTemplate = (templateId: string) => {
    logger.info('Using template:', templateId);
  };

  const handleEditTemplate = (templateId: string) => {
    logger.info('Editing template:', templateId);
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || message.type === filterType;
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const filteredAudiences = audiences.filter(audience => {
    const matchesSearch = audience.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         audience.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messaging & Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage platform communications and user notifications
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <PaperAirplaneIcon className="w-4 h-4" />
            <span>New Message</span>
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <DocumentTextIcon className="w-4 h-4" />
            <span>New Template</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, count: messages.length },
            { key: 'templates', label: 'Templates', icon: DocumentTextIcon, count: templates.filter(t => t.isActive).length },
            { key: 'audiences', label: 'Audiences', icon: UserGroupIcon, count: audiences.length },
            { key: 'analytics', label: 'Analytics', icon: ChartBarIcon, count: 0 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {(activeTab === 'messages' || activeTab === 'templates') && (
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
            <option value="in-app">In-App</option>
          </select>
        )}
        {activeTab === 'messages' && (
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        )}
      </div>

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div key={message.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(message.type)}
                        <h3 className="font-medium text-gray-900">{message.title}</h3>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(message.status)}`}>
                        {message.status}
                      </span>
                      {getStatusIcon(message.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{message.content.substring(0, 120)}...</p>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Recipients</p>
                        <p className="text-sm font-medium text-gray-900">{message.recipients.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Delivered</p>
                        <p className="text-sm font-medium text-gray-900">
                          {message.deliveredCount.toLocaleString()} ({Math.round((message.deliveredCount / message.recipients) * 100)}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Opened</p>
                        <p className="text-sm font-medium text-gray-900">
                          {message.openedCount.toLocaleString()} ({Math.round((message.openedCount / message.deliveredCount) * 100) || 0}%)
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Clicked</p>
                        <p className="text-sm font-medium text-gray-900">
                          {message.clickedCount.toLocaleString()} ({Math.round((message.clickedCount / message.openedCount) * 100) || 0}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <span>Target: {message.targetAudience}</span>
                        <span className="mx-2">•</span>
                        <span>Created by: {message.createdBy}</span>
                      </div>
                      <div>
                        {message.status === 'scheduled' && message.scheduledAt && (
                          <span>Scheduled: {new Date(message.scheduledAt).toLocaleString()}</span>
                        )}
                        {message.sentAt && (
                          <span>Sent: {new Date(message.sentAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditMessage(message.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                    </button>
                    {message.status === 'draft' && (
                      <button
                        onClick={() => handleSendMessage(message.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Send
                      </button>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(template.type)}
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(template.category)}`}>
                        {template.category}
                      </span>
                      {!template.isActive && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template.id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {template.subject && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Subject</p>
                  <p className="text-sm text-gray-900 font-medium">{template.subject}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Content</p>
                <p className="text-sm text-gray-600">{template.content.substring(0, 120)}...</p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Variables</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {'{{'}{variable}{'}}'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-gray-500">
                  <span>Used {template.usageCount} times</span>
                  {template.lastUsed && (
                    <>
                      <span className="mx-1">•</span>
                      <span>Last: {new Date(template.lastUsed).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleUseTemplate(template.id)}
                disabled={!template.isActive}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium ${
                  template.isActive
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'audiences' && (
        <div className="space-y-4">
          {filteredAudiences.map((audience) => (
            <div key={audience.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="font-medium text-gray-900">{audience.name}</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-medium rounded-full">
                      {audience.userCount.toLocaleString()} users
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{audience.description}</p>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Criteria</p>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                      {audience.criteria}
                    </p>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(audience.lastUpdated).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Message Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Messages Sent</span>
                <span className="text-lg font-semibold text-gray-900">15,420</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivery Rate</span>
                <span className="text-lg font-semibold text-green-600">98.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Open Rate</span>
                <span className="text-lg font-semibold text-blue-600">72.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Click Rate</span>
                <span className="text-lg font-semibold text-purple-600">15.8%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Channel Performance</h3>
            <div className="space-y-4">
              {[
                { type: 'Email', sent: 8450, rate: '75.2%', color: 'bg-blue-500' },
                { type: 'Push', sent: 4200, rate: '68.9%', color: 'bg-green-500' },
                { type: 'In-App', sent: 2300, rate: '89.1%', color: 'bg-purple-500' },
                { type: 'SMS', sent: 470, rate: '45.3%', color: 'bg-yellow-500' }
              ].map((channel) => (
                <div key={channel.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                    <span className="text-sm text-gray-900">{channel.type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{channel.sent.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{channel.rate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;