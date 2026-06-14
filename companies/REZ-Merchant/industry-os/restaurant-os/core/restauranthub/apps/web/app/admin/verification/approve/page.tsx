'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  BellIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface VerificationRequest {
  id: string;
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  completedDocuments: number;
  totalDocuments: number;
  lastUpdated: string;
  assignedTo?: string;
  businessType: string;
  estimatedReviewTime: number;
}

interface ApprovalAction {
  requestId: string;
  action: 'approve' | 'reject' | 'request_changes';
  reason?: string;
  conditions?: string[];
  followUpRequired: boolean;
  notifyOwner: boolean;
  assignTo?: string;
}

const approvalReasons = {
  approve: [
    'All documents verified successfully',
    'Business meets all compliance requirements',
    'Owner credentials verified',
    'Location and licensing approved',
  ],
  reject: [
    'Incomplete documentation',
    'Invalid or expired licenses',
    'Business location not compliant',
    'Owner verification failed',
    'Previous violations found',
  ],
  request_changes: [
    'Document quality needs improvement',
    'Additional documentation required',
    'License renewal needed',
    'Address verification incomplete',
    'Business details need clarification',
  ],
};

// Map raw VendorApplication fields to VerificationRequest shape
function mapToVerificationRequest(item): VerificationRequest {
  return {
    id: item.id,
    restaurantId: item.restaurantId ?? item.id,
    restaurantName: item.businessName ?? item.restaurantName ?? 'Unknown',
    ownerName: item.ownerName ?? item.contactName ?? 'Unknown',
    email: item.contactEmail ?? item.email ?? '',
    phone: item.contactPhone ?? item.phone ?? '',
    submittedAt: item.createdAt ?? item.submittedAt ?? new Date().toISOString(),
    status: (item.status as VerificationRequest['status']) ?? 'PENDING',
    priority: (item.priority as VerificationRequest['priority']) ?? 'MEDIUM',
    completedDocuments: item.completedDocuments ?? 0,
    totalDocuments: item.totalDocuments ?? 1,
    lastUpdated: item.updatedAt ?? item.lastUpdated ?? new Date().toISOString(),
    assignedTo: item.assignedTo,
    businessType: item.category ?? item.businessType ?? 'Restaurant',
    estimatedReviewTime: item.estimatedReviewTime ?? 4,
  };
}

export default function ApprovalActionsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState<ApprovalAction | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const response = await apiClient.get<unknown>('/admin/verification?limit=100');
      const raw = response?.data ?? response;
      const items: unknown[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setRequests(items.map(mapToVerificationRequest));
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(req => req.priority === priorityFilter);
    }

    if (assigneeFilter) {
      if (assigneeFilter === 'unassigned') {
        filtered = filtered.filter(req => !req.assignedTo);
      } else {
        filtered = filtered.filter(req => req.assignedTo?.includes(assigneeFilter));
      }
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter, requests]);

  const handleSingleAction = (requestId: string, action: 'approve' | 'reject' | 'request_changes') => {
    setCurrentAction({
      requestId,
      action,
      followUpRequired: false,
      notifyOwner: true,
    });
    setShowActionModal(true);
  };

  const handleBulkAction = (action: 'approve' | 'reject' | 'request_changes') => {
    if (selectedRequests.length === 0) {
      toast.error('Please select requests first');
      return;
    }

    setCurrentAction({
      requestId: selectedRequests.join(','),
      action,
      followUpRequired: false,
      notifyOwner: true,
    });
    setShowActionModal(true);
  };

  const resetModal = () => {
    setShowActionModal(false);
    setCurrentAction(null);
    setActionReason('');
    setCustomReason('');
    setConditions([]);
    setNewCondition('');
    setFollowUpRequired(false);
    setNotifyOwner(true);
    setSelectedRequests([]);
  };

  const executeAction = async () => {
    if (!currentAction) return;

    const finalReason = actionReason === 'custom' ? customReason : actionReason;

    if (!finalReason.trim()) {
      toast.error('Please provide a reason for the action');
      return;
    }

    const requestIds = currentAction.requestId.split(',');
    const statusMap = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      request_changes: 'REQUIRES_CHANGES',
    } as const;
    const newStatus = statusMap[currentAction.action];

    setSubmitting(true);
    try {
      await Promise.all(
        requestIds.map(id =>
          apiClient.patch(`/admin/verification/${id}`, {
            status: newStatus,
            reason: finalReason,
          })
        )
      );

      setRequests(prev =>
        prev.map(req =>
          requestIds.includes(req.id)
            ? { ...req, status: newStatus, lastUpdated: new Date().toISOString() }
            : req
        )
      );

      toast.success(`${requestIds.length} request(s) ${currentAction.action.replace('_', ' ')}d successfully`);
      resetModal();
    } catch {
      toast.error('Failed to execute action');
    } finally {
      setSubmitting(false);
    }
  };

  const addCondition = () => {
    if (newCondition.trim() && !conditions.includes(newCondition.trim())) {
      setConditions([...conditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setConditions(conditions.filter(c => c !== condition));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'yellow';
      case 'IN_REVIEW': return 'blue';
      case 'REQUIRES_CHANGES': return 'orange';
      default: return 'gray';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    inReview: requests.filter(r => r.status === 'IN_REVIEW').length,
    requiresChanges: requests.filter(r => r.status === 'REQUIRES_CHANGES').length,
    urgent: requests.filter(r => r.priority === 'URGENT').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
        <p className="text-gray-700 font-medium">Failed to load verification requests</p>
        <Button onClick={fetchRequests} variant="outline" size="default">
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Actions</h1>
          <p className="text-gray-600 mt-1">Review and approve restaurant verification requests</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" size="default">
            <BellIcon className="w-4 h-4 mr-2" />
            Set Reminders
          </Button>
          <Button variant="outline" size="default">
            <EnvelopeIcon className="w-4 h-4 mr-2" />
            Bulk Notify
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inReview}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Requires Changes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.requiresChanges}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Urgent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by restaurant name, owner, email, or request ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[150px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="REQUIRES_CHANGES">Requires Changes</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="min-w-[130px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Priority</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="min-w-[150px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedRequests.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedRequests.length} request(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  size="default"
                  variant="default"
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Approve All
                </Button>
                <Button
                  size="default"
                  variant="default"
                  onClick={() => handleBulkAction('reject')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => handleBulkAction('request_changes')}
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  Request Changes
                </Button>
                <Button
                  size="default"
                  variant="outline"
                  onClick={() => setSelectedRequests([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Verification Requests */}
      <Card>
        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-medium">No verification requests found</p>
            <p className="text-sm mt-1">
              {requests.length === 0
                ? 'There are no pending verification requests.'
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests(filteredRequests.map(r => r.id));
                        } else {
                          setSelectedRequests([]);
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status &amp; Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests([...selectedRequests, request.id]);
                          } else {
                            setSelectedRequests(selectedRequests.filter(id => id !== request.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.id}</div>
                        <div className="text-sm text-gray-500">
                          Submitted: {format(new Date(request.submittedAt), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          Est. review: {request.estimatedReviewTime}h
                        </div>
                        {request.assignedTo && (
                          <div className="text-xs text-blue-600 mt-1">
                            Assigned to: {request.assignedTo}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-300 flex items-center justify-center">
                            <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.restaurantName}</div>
                          <div className="text-sm text-gray-500">{request.ownerName}</div>
                          <div className="text-xs text-gray-500">{request.businessType}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <Badge color={getStatusBadgeColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <br />
                        <Badge color={getPriorityBadgeColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.completedDocuments}/{request.totalDocuments} documents
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${getProgressPercentage(request.completedDocuments, request.totalDocuments)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getProgressPercentage(request.completedDocuments, request.totalDocuments)}% complete
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-1">
                          <Button
                            size="default"
                            variant="default"
                            onClick={() => handleSingleAction(request.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                            disabled={request.status === 'APPROVED'}
                          >
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="default"
                            variant="default"
                            onClick={() => handleSingleAction(request.id, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                            disabled={request.status === 'REJECTED'}
                          >
                            <XCircleIcon className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                        <Button
                          size="default"
                          variant="outline"
                          onClick={() => handleSingleAction(request.id, 'request_changes')}
                          className="border-orange-600 text-orange-600 hover:bg-orange-50 text-xs"
                          disabled={request.status === 'REQUIRES_CHANGES'}
                        >
                          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                          Request Changes
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Action Modal */}
      {showActionModal && currentAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentAction.action.charAt(0).toUpperCase() + currentAction.action.slice(1).replace('_', ' ')} Request
            </h3>

            <div className="space-y-4">
              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for {currentAction.action.replace('_', ' ')}
                </label>
                <select
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
                >
                  <option value="">Select a reason...</option>
                  {approvalReasons[currentAction.action].map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                  <option value="custom">Custom reason...</option>
                </select>

                {actionReason === 'custom' && (
                  <Textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    rows={3}
                  />
                )}
              </div>

              {/* Conditions (for request_changes action) */}
              {currentAction.action === 'request_changes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions to fulfill
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      placeholder="Add condition..."
                      onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                    />
                    <Button onClick={addCondition} variant="outline" size="default">
                      Add
                    </Button>
                  </div>

                  {conditions.length > 0 && (
                    <div className="space-y-1">
                      {conditions.map((condition, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-900">{condition}</span>
                          <Button
                            size="default"
                            variant="outline"
                            onClick={() => removeCondition(condition)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="followUp"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="followUp" className="ml-2 text-sm text-gray-700">
                    Create follow-up task
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notify"
                    checked={notifyOwner}
                    onChange={(e) => setNotifyOwner(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="notify" className="ml-2 text-sm text-gray-700">
                    Notify restaurant owner via email/SMS
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={resetModal}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                className={
                  currentAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  currentAction.action === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                  'bg-orange-600 hover:bg-orange-700 text-white'
                }
                disabled={submitting || !actionReason || (actionReason === 'custom' && !customReason.trim())}
                size="default"
                variant="default"
              >
                {submitting ? 'Saving...' : currentAction.action.charAt(0).toUpperCase() + currentAction.action.slice(1).replace('_', ' ')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
