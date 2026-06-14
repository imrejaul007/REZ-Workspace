'use client';

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  FlagIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  HandRaisedIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface ContentReport {
  id: string;
  type: 'comment' | 'review' | 'message' | 'profile' | 'post';
  contentId: string;
  content: string;
  reportReason: string;
  reportedBy: string;
  reportedUser: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  moderatorNotes?: string;
  assignedTo?: string;
  category: string;
}

interface ModerationAction {
  id: string;
  type: 'warning' | 'content_removal' | 'temporary_ban' | 'permanent_ban' | 'account_restriction';
  targetUser: string;
  reason: string;
  duration?: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'expired' | 'revoked';
}

interface AutoModerationRule {
  id: string;
  name: string;
  type: 'keyword' | 'pattern' | 'behavior' | 'spam';
  criteria: string;
  action: 'flag' | 'hide' | 'delete' | 'ban';
  severity: 'low' | 'medium' | 'high';
  isActive: boolean;
  triggerCount: number;
  lastTriggered?: string;
}

const CommunityModerationPage = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'actions' | 'rules' | 'analytics'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const [reports] = useState<ContentReport[]>([
    {
      id: '1',
      type: 'review',
      contentId: 'rev_123',
      content: 'This restaurant is absolutely terrible! The owner is a complete idiot and the staff are rude jerks...',
      reportReason: 'Harassment and inappropriate language',
      reportedBy: 'user_456',
      reportedUser: 'angry_reviewer',
      status: 'pending',
      priority: 'high',
      createdAt: '2024-01-15T14:30:00Z',
      category: 'Inappropriate Content',
      assignedTo: 'mod_sarah'
    },
    {
      id: '2',
      type: 'comment',
      contentId: 'comm_789',
      content: 'Check out this amazing deal! Get 50% off everything at bit.ly/fake-deal-123',
      reportReason: 'Spam and suspicious links',
      reportedBy: 'user_789',
      reportedUser: 'spam_account',
      status: 'investigating',
      priority: 'medium',
      createdAt: '2024-01-15T12:15:00Z',
      category: 'Spam',
      assignedTo: 'mod_john',
      moderatorNotes: 'Link verified as malicious. Checking for similar patterns from this user.'
    },
    {
      id: '3',
      type: 'profile',
      contentId: 'prof_456',
      content: 'Profile contains inappropriate photos and false credentials',
      reportReason: 'Fake profile with inappropriate content',
      reportedBy: 'user_321',
      reportedUser: 'fake_chef',
      status: 'resolved',
      priority: 'critical',
      createdAt: '2024-01-14T16:45:00Z',
      resolvedAt: '2024-01-15T09:30:00Z',
      category: 'Identity Fraud',
      assignedTo: 'mod_sarah',
      moderatorNotes: 'Profile removed, user permanently banned for identity fraud'
    },
    {
      id: '4',
      type: 'message',
      contentId: 'msg_654',
      content: 'Inappropriate direct message containing harassment',
      reportReason: 'Harassment via direct message',
      reportedBy: 'restaurant_owner',
      reportedUser: 'problem_user',
      status: 'dismissed',
      priority: 'low',
      createdAt: '2024-01-14T10:20:00Z',
      resolvedAt: '2024-01-14T15:00:00Z',
      category: 'Harassment',
      assignedTo: 'mod_mike',
      moderatorNotes: 'Upon investigation, message was taken out of context. No violation found.'
    }
  ]);

  const [actions] = useState<ModerationAction[]>([
    {
      id: '1',
      type: 'permanent_ban',
      targetUser: 'fake_chef',
      reason: 'Identity fraud and fake credentials',
      createdBy: 'mod_sarah',
      createdAt: '2024-01-15T09:30:00Z',
      status: 'active'
    },
    {
      id: '2',
      type: 'content_removal',
      targetUser: 'spam_account',
      reason: 'Posting malicious links',
      createdBy: 'mod_john',
      createdAt: '2024-01-15T13:15:00Z',
      status: 'active'
    },
    {
      id: '3',
      type: 'temporary_ban',
      targetUser: 'rude_customer',
      reason: 'Repeated harassment of restaurant staff',
      duration: '7 days',
      createdBy: 'mod_sarah',
      createdAt: '2024-01-14T11:00:00Z',
      status: 'expired'
    },
    {
      id: '4',
      type: 'warning',
      targetUser: 'angry_reviewer',
      reason: 'Inappropriate language in reviews',
      createdBy: 'mod_mike',
      createdAt: '2024-01-13T15:45:00Z',
      status: 'active'
    }
  ]);

  const [rules] = useState<AutoModerationRule[]>([
    {
      id: '1',
      name: 'Profanity Filter',
      type: 'keyword',
      criteria: 'Contains: profanity, offensive language, slurs',
      action: 'flag',
      severity: 'medium',
      isActive: true,
      triggerCount: 45,
      lastTriggered: '2024-01-15T16:20:00Z'
    },
    {
      id: '2',
      name: 'Spam Link Detection',
      type: 'pattern',
      criteria: 'Multiple shortened URLs or suspicious domains',
      action: 'hide',
      severity: 'high',
      isActive: true,
      triggerCount: 23,
      lastTriggered: '2024-01-15T14:10:00Z'
    },
    {
      id: '3',
      name: 'Review Bombing Detection',
      type: 'behavior',
      criteria: 'Multiple 1-star reviews from same IP/device in short time',
      action: 'flag',
      severity: 'high',
      isActive: true,
      triggerCount: 8,
      lastTriggered: '2024-01-14T20:30:00Z'
    },
    {
      id: '4',
      name: 'Excessive Posting',
      type: 'spam',
      criteria: '>10 posts/comments per hour from single user',
      action: 'ban',
      severity: 'medium',
      isActive: false,
      triggerCount: 0
    },
    {
      id: '5',
      name: 'Personal Information Sharing',
      type: 'pattern',
      criteria: 'Contains phone numbers, email addresses, or addresses',
      action: 'delete',
      severity: 'high',
      isActive: true,
      triggerCount: 12,
      lastTriggered: '2024-01-15T11:45:00Z'
    }
  ]);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
      active: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      revoked: 'bg-purple-100 text-purple-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return badges[priority as keyof typeof badges] || badges.low;
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return badges[severity as keyof typeof badges] || badges.low;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      case 'comment': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      case 'message': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      case 'profile': return <UserIcon className="w-5 h-5" />;
      case 'post': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      default: return <FlagIcon className="w-5 h-5" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'content_removal': return <XMarkIcon className="w-5 h-5 text-red-500" />;
      case 'temporary_ban': return <ClockIcon className="w-5 h-5 text-orange-500" />;
      case 'permanent_ban': return <NoSymbolIcon className="w-5 h-5 text-red-500" />;
      case 'account_restriction': return <HandRaisedIcon className="w-5 h-5 text-purple-500" />;
      default: return <ShieldCheckIcon className="w-5 h-5" />;
    }
  };

  const handleApproveReport = (id: string) => {
    logger.info('Approving report:', id);
  };

  const handleDismissReport = (id: string) => {
    logger.info('Dismissing report:', id);
  };

  const handleViewContent = (id: string) => {
    logger.info('Viewing content:', id);
  };

  const handleToggleRule = (id: string) => {
    logger.info('Toggling rule:', id);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportedUser.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
    const matchesType = filterType === 'all' || report.type === filterType;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const filteredActions = actions.filter(action => {
    const matchesSearch = action.targetUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || action.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.criteria.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Moderation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and moderate community content and user behavior
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>New Rule</span>
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'reports', label: 'Content Reports', count: reports.filter(r => r.status === 'pending').length },
            { key: 'actions', label: 'Moderation Actions', count: actions.filter(a => a.status === 'active').length },
            { key: 'rules', label: 'Auto-Moderation Rules', count: rules.filter(r => r.isActive).length },
            { key: 'analytics', label: 'Analytics', count: 0 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-red-100 text-red-900 py-0.5 px-2.5 rounded-full text-xs">
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
            placeholder="Search reports, users, or content..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {activeTab === 'reports' && (
          <>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </>
        )}
        
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          {activeTab === 'reports' && (
            <>
              <option value="review">Reviews</option>
              <option value="comment">Comments</option>
              <option value="message">Messages</option>
              <option value="profile">Profiles</option>
              <option value="post">Posts</option>
            </>
          )}
          {activeTab === 'actions' && (
            <>
              <option value="warning">Warnings</option>
              <option value="content_removal">Content Removal</option>
              <option value="temporary_ban">Temporary Ban</option>
              <option value="permanent_ban">Permanent Ban</option>
              <option value="account_restriction">Account Restriction</option>
            </>
          )}
        </select>
      </div>

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FlagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getTypeIcon(report.type)}
                      <span className="font-medium text-gray-900 capitalize">{report.type}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(report.priority)}`}>
                        {report.priority}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Reported Content:</span>
                      </p>
                      <div className="bg-gray-50 p-3 rounded border text-sm text-gray-900 italic">
                        "{report.content.substring(0, 200)}..."
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Report Reason</p>
                        <p className="text-sm text-gray-900">{report.reportReason}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm text-gray-900">{report.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reported User</p>
                        <p className="text-sm text-gray-900">{report.reportedUser}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reported By</p>
                        <p className="text-sm text-gray-900">{report.reportedBy}</p>
                      </div>
                    </div>

                    {report.moderatorNotes && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-1">Moderator Notes</p>
                        <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border">
                          {report.moderatorNotes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <span>Assigned to: {report.assignedTo || 'Unassigned'}</span>
                        <span className="mx-2">•</span>
                        <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                      </div>
                      {report.resolvedAt && (
                        <span>Resolved: {new Date(report.resolvedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => handleViewContent(report.id)}
                      className="text-gray-400 hover:text-gray-600 p-2"
                      title="View Content"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveReport(report.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                        >
                          Take Action
                        </button>
                        <button
                          onClick={() => handleDismissReport(report.id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <div key={action.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getActionIcon(action.type)}
                  <div>
                    <h3 className="font-medium text-gray-900 capitalize">
                      {action.type.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">Target: {action.targetUser}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(action.status)}`}>
                    {action.status}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{action.createdBy}</p>
                  <p>{new Date(action.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-900 mb-2">
                  <span className="font-medium">Reason:</span> {action.reason}
                </p>
                {action.duration && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Duration:</span> {action.duration}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getSeverityBadge(rule.severity)}`}>
                      {rule.severity}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Criteria</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                      {rule.criteria}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="text-sm text-gray-900 capitalize">{rule.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Action</p>
                      <p className="text-sm text-gray-900 capitalize">{rule.action}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Triggers</p>
                      <p className="text-sm text-gray-900">{rule.triggerCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Triggered</p>
                      <p className="text-sm text-gray-900">
                        {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-6">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      rule.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {rule.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Moderation Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Reports (30 days)</span>
                <span className="text-lg font-semibold text-gray-900">324</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Review</span>
                <span className="text-lg font-semibold text-yellow-600">47</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolved</span>
                <span className="text-lg font-semibold text-green-600">251</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dismissed</span>
                <span className="text-lg font-semibold text-gray-600">26</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Auto-Moderation Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rules Triggered</span>
                <span className="text-lg font-semibold text-gray-900">127</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Content Auto-Flagged</span>
                <span className="text-lg font-semibold text-orange-600">89</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Content Auto-Removed</span>
                <span className="text-lg font-semibold text-red-600">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">False Positives</span>
                <span className="text-lg font-semibold text-purple-600">12</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Response Times</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Response Time</span>
                <span className="text-lg font-semibold text-gray-900">4.2h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Critical Reports</span>
                <span className="text-lg font-semibold text-red-600">&lt; 1h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">High Priority</span>
                <span className="text-lg font-semibold text-orange-600">2.1h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Standard Reports</span>
                <span className="text-lg font-semibold text-blue-600">6.8h</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityModerationPage;