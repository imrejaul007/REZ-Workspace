'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  DocumentIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface VerificationRequest {
  id: string;
  applicantName: string;
  applicantType: 'RESTAURANT' | 'VENDOR' | 'EMPLOYEE' | 'INDIVIDUAL';
  email: string;
  phone: string;
  verificationType: 'IDENTITY' | 'BUSINESS' | 'DOCUMENT' | 'BACKGROUND';
  status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED' | 'REQUIRES_INFO';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents: {
    type: string;
    name: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
  }[];
  riskScore: number;
  notes?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function VerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter) params.set('status', statusFilter);
        if (typeFilter) params.set('type', typeFilter);
        params.set('page', String(currentPage));
        params.set('limit', String(requestsPerPage));

        const res = await fetch(`${API_BASE}/admin/verification?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          setRequests(Array.isArray(data) ? data : data.requests || []);
        } else {
          setRequests([]);
        }
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [searchTerm, statusFilter, typeFilter, currentPage]);

  const handleAction = async (action: 'approve' | 'reject' | 'start_review', requestId: string) => {
    const statusMap = {
      approve: 'VERIFIED',
      reject: 'REJECTED',
      start_review: 'IN_REVIEW',
    } as const;

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/verification/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: statusMap[action] }),
      });
      if (res.ok) {
        setRequests(prev =>
          prev.map(r =>
            r.id === requestId
              ? { ...r, status: statusMap[action], reviewedAt: new Date().toISOString() }
              : r
          )
        );
      }
    } catch {
      // silently fail
    }
    setSelectedRequest(null);
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    inReview: requests.filter(r => r.status === 'IN_REVIEW').length,
    verified: requests.filter(r => r.status === 'VERIFIED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IDENTITY': return IdentificationIcon;
      case 'BUSINESS': return BuildingOfficeIcon;
      case 'BACKGROUND': return DocumentCheckIcon;
      default: return DocumentIcon;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Management</h1>
          <p className="text-gray-600 mt-1">Review and approve verification requests</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: DocumentIcon, bg: 'bg-gray-100', color: 'text-gray-600' },
          { label: 'Pending', value: stats.pending, icon: ClockIcon, bg: 'bg-yellow-100', color: 'text-yellow-600' },
          { label: 'In Review', value: stats.inReview, icon: EyeIcon, bg: 'bg-blue-100', color: 'text-blue-600' },
          { label: 'Verified', value: stats.verified, icon: CheckIcon, bg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Rejected', value: stats.rejected, icon: XMarkIcon, bg: 'bg-red-100', color: 'text-red-600' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${bg} rounded-lg`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="min-w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="REQUIRES_INFO">Requires Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="min-w-[130px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="IDENTITY">Identity</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="DOCUMENT">Document</SelectItem>
                <SelectItem value="BACKGROUND">Background</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading verification requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <DocumentCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No verification requests</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter || typeFilter
                ? 'Try adjusting your filters.'
                : 'No verification requests have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => {
                  const TypeIcon = getTypeIcon(request.verificationType);
                  const approvedDocs = request.documents.filter(d => d.status === 'APPROVED').length;
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{request.applicantName}</div>
                        <div className="text-xs text-gray-500">{request.email}</div>
                        <Badge variant="secondary" className="text-xs mt-1">{request.applicantType}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{request.verificationType}</span>
                        </div>
                        <span className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full ${
                          request.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                          request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                          request.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                          request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          request.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'REQUIRES_INFO' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{approvedDocs}/{request.documents.length} approved</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${request.documents.length > 0 ? (approvedDocs / request.documents.length) * 100 : 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center space-x-1`}>
                          <div className={`w-2 h-2 rounded-full ${
                            request.riskScore < 0.3 ? 'bg-green-500' :
                            request.riskScore < 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm text-gray-900">{(request.riskScore * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(request.submittedAt), 'MMM dd')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          {request.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction('start_review', request.id)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              Start Review
                            </Button>
                          )}
                          {request.status === 'IN_REVIEW' && (
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction('approve', request.id)}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction('reject', request.id)}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review: {selectedRequest.applicantName}</h3>
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                <XMarkIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-gray-500">Name:</span> {selectedRequest.applicantName}</div>
                <div><span className="font-medium text-gray-500">Type:</span> {selectedRequest.applicantType}</div>
                <div><span className="font-medium text-gray-500">Email:</span> {selectedRequest.email}</div>
                <div><span className="font-medium text-gray-500">Phone:</span> {selectedRequest.phone}</div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Documents ({selectedRequest.documents.length})</h4>
                <div className="space-y-2">
                  {selectedRequest.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-900">{doc.name}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        doc.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        doc.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                  <strong>Notes:</strong> {selectedRequest.notes}
                </div>
              )}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleAction('approve', selectedRequest.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('reject', selectedRequest.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
