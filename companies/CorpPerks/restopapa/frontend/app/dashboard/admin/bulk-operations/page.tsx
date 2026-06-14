'use client';

import React, { useState } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface BulkOperation {
  id: string;
  name: string;
  type: 'users' | 'jobs' | 'products' | 'restaurants' | 'orders';
  action: 'approve' | 'reject' | 'suspend' | 'activate' | 'delete' | 'feature' | 'archive';
  targetCount: number;
  processedCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  criteria: string;
}

interface BulkActionTemplate {
  id: string;
  name: string;
  type: 'users' | 'jobs' | 'products' | 'restaurants' | 'orders';
  action: 'approve' | 'reject' | 'suspend' | 'activate' | 'delete' | 'feature' | 'archive';
  description: string;
  defaultCriteria: string;
}

const BulkOperationsPage = () => {
  const [activeTab, setActiveTab] = useState<'operations' | 'templates' | 'history'>('operations');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [operations] = useState<BulkOperation[]>([
    {
      id: '1',
      name: 'Suspend Inactive Users',
      type: 'users',
      action: 'suspend',
      targetCount: 150,
      processedCount: 75,
      status: 'running',
      createdAt: '2024-01-15T10:30:00Z',
      createdBy: 'Admin User',
      criteria: 'Last login > 90 days AND account status = active'
    },
    {
      id: '2',
      name: 'Approve Pending Restaurants',
      type: 'restaurants',
      action: 'approve',
      targetCount: 25,
      processedCount: 25,
      status: 'completed',
      createdAt: '2024-01-14T14:20:00Z',
      completedAt: '2024-01-14T14:45:00Z',
      createdBy: 'Admin User',
      criteria: 'Status = pending AND documents verified = true'
    },
    {
      id: '3',
      name: 'Delete Expired Job Posts',
      type: 'jobs',
      action: 'delete',
      targetCount: 80,
      processedCount: 0,
      status: 'pending',
      createdAt: '2024-01-15T09:15:00Z',
      createdBy: 'System',
      criteria: 'Expiry date < today AND status != active'
    },
    {
      id: '4',
      name: 'Feature Top Products',
      type: 'products',
      action: 'feature',
      targetCount: 50,
      processedCount: 12,
      status: 'paused',
      createdAt: '2024-01-15T08:00:00Z',
      createdBy: 'Marketing Team',
      criteria: 'Rating >= 4.5 AND sales_count >= 100'
    }
  ]);

  const [templates] = useState<BulkActionTemplate[]>([
    {
      id: '1',
      name: 'Suspend Inactive Users',
      type: 'users',
      action: 'suspend',
      description: 'Automatically suspend users who haven\'t logged in for specified period',
      defaultCriteria: 'Last login > X days AND account status = active'
    },
    {
      id: '2',
      name: 'Archive Old Jobs',
      type: 'jobs',
      action: 'archive',
      description: 'Archive job postings that have been expired for extended period',
      defaultCriteria: 'Expiry date < X days ago AND status = expired'
    },
    {
      id: '3',
      name: 'Feature High-Rated Products',
      type: 'products',
      action: 'feature',
      description: 'Automatically feature products with excellent ratings and sales',
      defaultCriteria: 'Rating >= X AND sales_count >= Y'
    },
    {
      id: '4',
      name: 'Approve Verified Restaurants',
      type: 'restaurants',
      action: 'approve',
      description: 'Auto-approve restaurants that have completed verification',
      defaultCriteria: 'Documents verified = true AND background check = passed'
    },
    {
      id: '5',
      name: 'Cancel Abandoned Orders',
      type: 'orders',
      action: 'delete',
      description: 'Clean up orders that were never completed or paid',
      defaultCriteria: 'Status = pending AND created > X days ago'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'users': return <UserGroupIcon className="w-5 h-5" />;
      case 'jobs': return <BriefcaseIcon className="w-5 h-5" />;
      case 'products': return <ShoppingBagIcon className="w-5 h-5" />;
      case 'restaurants': return <BuildingStorefrontIcon className="w-5 h-5" />;
      case 'orders': return <DocumentTextIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      paused: 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const handleStartOperation = (id: string) => {
    logger.info('Starting operation:', id);
  };

  const handlePauseOperation = (id: string) => {
    logger.info('Pausing operation:', id);
  };

  const handleCancelOperation = (id: string) => {
    logger.info('Canceling operation:', id);
  };

  const handleCreateFromTemplate = (templateId: string) => {
    logger.info('Creating operation from template:', templateId);
  };

  const filteredOperations = operations.filter(operation => {
    const matchesSearch = operation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operation.criteria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || operation.type === filterType;
    const matchesStatus = filterStatus === 'all' || operation.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Operations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage batch operations across platform entities
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <PlayIcon className="w-4 h-4" />
            <span>New Operation</span>
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Export Results</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'operations', label: 'Active Operations', count: operations.filter(o => ['pending', 'running', 'paused'].includes(o.status)).length },
            { key: 'templates', label: 'Templates', count: templates.length },
            { key: 'history', label: 'History', count: operations.filter(o => ['completed', 'failed'].includes(o.status)).length }
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
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
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
            placeholder="Search operations or templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="users">Users</option>
          <option value="jobs">Jobs</option>
          <option value="products">Products</option>
          <option value="restaurants">Restaurants</option>
          <option value="orders">Orders</option>
        </select>
        {activeTab === 'operations' && (
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        )}
      </div>

      {activeTab === 'operations' && (
        <div className="space-y-4">
          {filteredOperations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FunnelIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No operations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            filteredOperations.map((operation) => (
              <div key={operation.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(operation.type)}
                      <span className="font-medium text-gray-900">{operation.name}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(operation.status)}`}>
                      {operation.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {operation.status === 'running' && (
                      <button
                        onClick={() => handlePauseOperation(operation.id)}
                        className="text-yellow-600 hover:text-yellow-700 p-1"
                      >
                        <PauseIcon className="w-5 h-5" />
                      </button>
                    )}
                    {(operation.status === 'pending' || operation.status === 'paused') && (
                      <button
                        onClick={() => handleStartOperation(operation.id)}
                        className="text-green-600 hover:text-green-700 p-1"
                      >
                        <PlayIcon className="w-5 h-5" />
                      </button>
                    )}
                    {operation.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelOperation(operation.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Progress</p>
                    <div className="mt-1 flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(operation.processedCount / operation.targetCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-gray-900">
                        {operation.processedCount}/{operation.targetCount}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="mt-1 text-sm text-gray-900">{operation.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(operation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-gray-500">Criteria</p>
                  <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                    {operation.criteria}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(template.type)}
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {template.action}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Default Criteria</p>
                <p className="text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                  {template.defaultCriteria}
                </p>
              </div>
              
              <button
                onClick={() => handleCreateFromTemplate(template.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {operations.filter(op => ['completed', 'failed'].includes(op.status)).map((operation) => (
            <div key={operation.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(operation.type)}
                    <span className="font-medium text-gray-900">{operation.name}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(operation.status)}`}>
                    {operation.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {operation.completedAt && `Completed: ${new Date(operation.completedAt).toLocaleDateString()}`}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Results</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {operation.processedCount}/{operation.targetCount} processed
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {operation.status === 'completed' ? '100%' : 
                     operation.status === 'failed' ? '0%' : 
                     `${Math.round((operation.processedCount / operation.targetCount) * 100)}%`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {operation.completedAt ? 
                      `${Math.round((new Date(operation.completedAt).getTime() - new Date(operation.createdAt).getTime()) / (1000 * 60))}m` : 
                      'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="mt-1 text-sm text-gray-900">{operation.createdBy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkOperationsPage;