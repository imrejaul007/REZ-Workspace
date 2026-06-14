'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PhotoIcon,
  CalendarIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ArrowDownTrayIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  type: 'GST' | 'FSSAI' | 'PAN' | 'BUSINESS_LICENSE' | 'IDENTITY_PROOF' | 'ADDRESS_PROOF' | string;
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  tags: string[];
  metadata: {
    expiryDate?: string;
    issueDate?: string;
    issuingAuthority?: string;
    documentNumber?: string;
  };
}

// Map a raw VendorApplication or document record to the Document shape
function mapToDocument(item): Document {
  return {
    id: item.id,
    fileName: item.fileName ?? item.documentUrl?.split('/').pop() ?? 'document',
    originalName: item.originalName ?? item.fileName ?? item.businessName ?? item.id,
    type: item.type ?? item.category ?? 'BUSINESS_LICENSE',
    restaurantId: item.restaurantId ?? item.id,
    restaurantName: item.restaurantName ?? item.businessName ?? 'Unknown',
    ownerName: item.ownerName ?? item.contactName ?? 'Unknown',
    fileUrl: item.fileUrl ?? item.documentUrl ?? '',
    thumbnailUrl: item.thumbnailUrl,
    fileSize: item.fileSize ?? 0,
    mimeType: item.mimeType ?? (item.fileName?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
    uploadedAt: item.uploadedAt ?? item.createdAt ?? new Date().toISOString(),
    status: (item.status as Document['status']) ?? 'PENDING',
    verifiedBy: item.verifiedBy,
    verifiedAt: item.verifiedAt,
    rejectionReason: item.rejectionReason,
    tags: item.tags ?? [],
    metadata: item.metadata ?? {},
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      // Fetch pending verifications and treat each as a document record
      const response = await apiClient.get<unknown>('/admin/verification?limit=100');
      const raw = response?.data ?? response;
      const items: unknown[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      setDocuments(items.map(mapToDocument));
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.metadata.documentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (dateFilter) {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(doc => new Date(doc.uploadedAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(doc => new Date(doc.uploadedAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(doc => new Date(doc.uploadedAt) >= filterDate);
          break;
      }
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateFilter, documents]);

  // Pagination
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredDocuments.slice(indexOfFirstDocument, indexOfLastDocument);
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      await apiClient.patch(`/admin/verification/${documentId}`, {
        status: newStatus,
        ...(reason ? { reason } : {}),
      });

      setDocuments(prev => prev.map(doc =>
        doc.id === documentId
          ? {
              ...doc,
              status: newStatus,
              rejectionReason: reason,
              verifiedBy: 'Admin',
              verifiedAt: new Date().toISOString(),
            }
          : doc
      ));

      toast.success(`Document ${action}d successfully`);
    } catch {
      toast.error(`Failed to ${action} document`);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'download') => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select documents first');
      return;
    }

    if (action === 'download') {
      toast.success(`Downloading ${selectedDocuments.length} documents...`);
      setSelectedDocuments([]);
      return;
    }

    try {
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      await Promise.all(
        selectedDocuments.map(id =>
          apiClient.patch(`/admin/verification/${id}`, { status: newStatus })
        )
      );

      setDocuments(prev => prev.map(doc =>
        selectedDocuments.includes(doc.id)
          ? {
              ...doc,
              status: newStatus,
              verifiedBy: 'Admin',
              verifiedAt: new Date().toISOString(),
            }
          : doc
      ));

      toast.success(`${selectedDocuments.length} documents ${action}d successfully`);
      setSelectedDocuments([]);
    } catch {
      toast.error(`Failed to ${action} documents`);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'PENDING': return 'yellow';
      default: return 'gray';
    }
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return PhotoIcon;
    } else if (mimeType === 'application/pdf') {
      return DocumentTextIcon;
    } else {
      return DocumentDuplicateIcon;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'PENDING').length,
    approved: documents.filter(d => d.status === 'APPROVED').length,
    rejected: documents.filter(d => d.status === 'REJECTED').length,
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
        <p className="text-gray-700 font-medium">Failed to load documents</p>
        <Button onClick={fetchDocuments} variant="outline" size="default">
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
          <h1 className="text-2xl font-bold text-gray-900">Document Viewer</h1>
          <p className="text-gray-600 mt-1">Review and manage verification documents</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <FolderIcon className="w-4 h-4 mr-2" />
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button variant="outline">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

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
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
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
                  placeholder="Search documents by name, restaurant, owner, or document number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="min-w-[160px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="GST">GST Certificate</option>
                <option value="FSSAI">FSSAI License</option>
                <option value="PAN">PAN Card</option>
                <option value="BUSINESS_LICENSE">Business License</option>
                <option value="IDENTITY_PROOF">Identity Proof</option>
                <option value="ADDRESS_PROOF">Address Proof</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[130px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="min-w-[130px] px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedDocuments.length} document(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve All
                </Button>
                <Button
                  onClick={() => handleBulkAction('reject')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject All
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction('download')}
                >
                  Download All
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDocuments([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Documents */}
      <Card>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-medium">No documents pending review</p>
            <p className="text-sm mt-1">All verification documents have been processed.</p>
          </div>
        ) : currentDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mb-3 text-gray-300" />
            <p className="font-medium">No documents match your filters</p>
            <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {currentDocuments.map((document) => {
              const IconComponent = getDocumentIcon(document.mimeType);
              return (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(document.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments([...selectedDocuments, document.id]);
                        } else {
                          setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Badge color={getStatusBadgeColor(document.status)}>
                      {document.status}
                    </Badge>
                  </div>

                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-gray-500" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm truncate">{document.type}</h4>
                    <p className="text-xs text-gray-600 truncate">{document.originalName}</p>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <BuildingStorefrontIcon className="w-4 h-4 mr-1" />
                      <span className="truncate">{document.restaurantName}</span>
                    </div>
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-1" />
                      <span className="truncate">{document.ownerName}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>{format(parseISO(document.uploadedAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {document.fileSize > 0 && (
                      <div className="flex items-center">
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        <span>{formatFileSize(document.fileSize)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                    <Button variant="outline">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      View
                    </Button>

                    {document.status === 'PENDING' && (
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => handleDocumentAction(document.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                        >
                          <CheckCircleIcon className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDocumentAction(document.id, 'reject', 'Rejected by admin')}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                        >
                          <XCircleIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {document.status === 'REJECTED' && document.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      {document.rejectionReason}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.length === currentDocuments.length && currentDocuments.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocuments(currentDocuments.map(d => d.id));
                        } else {
                          setSelectedDocuments([]);
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDocuments.map((document) => {
                  const IconComponent = getDocumentIcon(document.mimeType);
                  return (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(document.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments([...selectedDocuments, document.id]);
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(id => id !== document.id));
                            }
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{document.type}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{document.originalName}</div>
                            {document.fileSize > 0 && (
                              <div className="text-xs text-gray-400">{formatFileSize(document.fileSize)}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{document.restaurantName}</div>
                        <div className="text-sm text-gray-500">{document.ownerName}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={getStatusBadgeColor(document.status)}>
                          {document.status}
                        </Badge>
                        {document.verifiedBy && (
                          <div className="text-xs text-gray-500 mt-1">
                            by {document.verifiedBy}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="outline">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline">
                            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                            Download
                          </Button>

                          {document.status === 'PENDING' && (
                            <div className="flex space-x-1">
                              <Button
                                onClick={() => handleDocumentAction(document.id, 'approve')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleDocumentAction(document.id, 'reject', 'Rejected by admin')}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Reject
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstDocument + 1} to {Math.min(indexOfLastDocument, filteredDocuments.length)} of {filteredDocuments.length} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
