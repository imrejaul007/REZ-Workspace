'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api/client';

interface VerificationDocument {
  id: string;
  type: 'GST' | 'FSSAI' | 'PAN' | 'BUSINESS_LICENSE' | 'IDENTITY_PROOF' | 'ADDRESS_PROOF' | string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  fileSize: number;
  mimeType: string;
}

interface VerificationRequest {
  id: string;
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  submittedAt: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  documents: VerificationDocument[];
  businessDetails: {
    businessType: string;
    establishedYear: number;
    ownershipType: string;
    businessAddress: string;
    description: string;
  };
  verificationNotes: {
    id: string;
    note: string;
    addedBy: string;
    addedAt: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  }[];
  timeline: {
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }[];
}

// Map raw API data (VendorApplication or restaurant) to VerificationRequest
function mapToVerificationRequest(raw): VerificationRequest {
  const docs: VerificationDocument[] = [];
  if (raw.documents && Array.isArray(raw.documents)) {
    raw.documents.forEach((d, i: number) => {
      docs.push({
        id: d.id ?? `doc-${i}`,
        type: d.type ?? d.category ?? 'BUSINESS_LICENSE',
        fileName: d.fileName ?? d.documentUrl?.split('/').pop() ?? 'document',
        fileUrl: d.fileUrl ?? d.documentUrl ?? '',
        uploadedAt: d.uploadedAt ?? d.createdAt ?? new Date().toISOString(),
        status: d.status ?? 'PENDING',
        rejectionReason: d.rejectionReason,
        verifiedBy: d.verifiedBy,
        verifiedAt: d.verifiedAt,
        fileSize: d.fileSize ?? 0,
        mimeType: d.mimeType ?? 'application/pdf',
      });
    });
  } else if (raw.documentUrl) {
    docs.push({
      id: `doc-${raw.id}`,
      type: raw.category ?? 'BUSINESS_LICENSE',
      fileName: raw.documentUrl.split('/').pop() ?? 'document',
      fileUrl: raw.documentUrl,
      uploadedAt: raw.createdAt ?? new Date().toISOString(),
      status: (raw.status as VerificationDocument['status']) ?? 'PENDING',
      fileSize: 0,
      mimeType: 'application/pdf',
    });
  }

  return {
    id: raw.id,
    restaurantId: raw.restaurantId ?? raw.id,
    restaurantName: raw.restaurantName ?? raw.businessName ?? raw.name ?? 'Unknown',
    ownerName: raw.ownerName ?? raw.contactName ?? raw.owner?.name ?? 'Unknown',
    email: raw.email ?? raw.contactEmail ?? raw.owner?.email ?? '',
    phone: raw.phone ?? raw.contactPhone ?? '',
    submittedAt: raw.submittedAt ?? raw.createdAt ?? new Date().toISOString(),
    status: (raw.status as VerificationRequest['status']) ?? 'PENDING',
    assignedTo: raw.assignedTo,
    priority: (raw.priority as VerificationRequest['priority']) ?? 'MEDIUM',
    documents: docs,
    businessDetails: {
      businessType: raw.category ?? raw.businessType ?? raw.businessDetails?.businessType ?? 'Restaurant',
      establishedYear: raw.establishedYear ?? raw.businessDetails?.establishedYear ?? new Date().getFullYear(),
      ownershipType: raw.ownershipType ?? raw.businessDetails?.ownershipType ?? 'Unknown',
      businessAddress: raw.address ?? raw.businessAddress ?? raw.businessDetails?.businessAddress ?? '',
      description: raw.description ?? raw.businessDetails?.description ?? '',
    },
    verificationNotes: Array.isArray(raw.verificationNotes) ? raw.verificationNotes : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [
      {
        id: 'tl-1',
        action: 'Verification Request Submitted',
        performedBy: raw.ownerName ?? raw.contactName ?? 'Owner',
        timestamp: raw.createdAt ?? new Date().toISOString(),
        details: 'Verification request submitted',
      },
    ],
  };
}

export default function VerificationWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'>('INFO');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVerificationRequest = useCallback(async () => {
    if (!params?.id) return;
    setIsLoading(true);
    setNotFound(false);
    setFetchError(false);
    try {
      // Try verification endpoint first (VendorApplication), fall back to restaurant
      let raw: unknown = null;
      try {
        const res = await apiClient.get<{ data?: unknown[] }>(`/admin/verification?limit=200`);
        const data = res?.data;
        const items = Array.isArray(data) ? data : [];
        raw = items.find((item) => (item as { id?: string })?.id === params.id) ?? null;
      } catch {
        // ignore, try restaurant next
      }

      if (!raw) {
        try {
          const res = await apiClient.get<unknown>(`/admin/restaurants/${params.id}`);
          raw = res?.data ?? res;
        } catch (err: unknown) {
          const axiosErr = err as { response?: { status?: number } };
          if (axiosErr?.response?.status === 404) {
            setNotFound(true);
            return;
          }
          throw err;
        }
      }

      if (!raw) {
        setNotFound(true);
        return;
      }

      setVerificationRequest(mapToVerificationRequest(raw));
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchVerificationRequest();
  }, [fetchVerificationRequest]);

  const handleDocumentAction = async (documentId: string, action: 'approve' | 'reject', reason?: string) => {
    if (!verificationRequest) return;
    try {
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      await apiClient.patch(`/admin/verification/${documentId}`, {
        status: newStatus,
        ...(reason ? { reason } : {}),
      });

      setVerificationRequest(prev => {
        if (!prev) return null;
        return {
          ...prev,
          documents: prev.documents.map(doc =>
            doc.id === documentId
              ? {
                  ...doc,
                  status: newStatus,
                  rejectionReason: reason,
                  verifiedBy: 'Admin',
                  verifiedAt: new Date().toISOString(),
                }
              : doc
          ),
        };
      });

      toast.success(`Document ${action}d successfully`);
    } catch {
      toast.error(`Failed to ${action} document`);
    }
  };

  const handleOverallDecision = async (decision: 'approve' | 'reject' | 'request_changes', reason?: string) => {
    if (!verificationRequest) return;
    const statusMap = {
      approve: 'APPROVED',
      reject: 'REJECTED',
      request_changes: 'REQUIRES_CHANGES',
    } as const;
    const newStatus = statusMap[decision];

    setSubmitting(true);
    try {
      await apiClient.patch(`/admin/verification/${verificationRequest.id}`, {
        status: newStatus,
        ...(reason ? { reason } : {}),
      });

      setVerificationRequest(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Verification ${decision.replace('_', ' ')}d successfully`);
    } catch {
      toast.error(`Failed to ${decision} verification`);
    } finally {
      setSubmitting(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    const note = {
      id: `NOTE-${Date.now()}`,
      note: newNote,
      addedBy: 'Admin',
      addedAt: new Date().toISOString(),
      type: noteType,
    };

    setVerificationRequest(prev => prev ? {
      ...prev,
      verificationNotes: [note, ...prev.verificationNotes],
    } : null);

    setNewNote('');
    toast.success('Note added successfully');
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

  const getNoteBadgeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'green';
      case 'WARNING': return 'yellow';
      case 'ERROR': return 'red';
      case 'INFO': return 'blue';
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Request Not Found</h2>
          <p className="text-gray-600 mb-4">The verification request you are looking for does not exist.</p>
          <Button onClick={() => router.back()} size="default" variant="default">Go Back</Button>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Failed to load verification request</h2>
          <Button onClick={fetchVerificationRequest} variant="outline" size="default">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!verificationRequest) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="default"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Verification Request #{verificationRequest.id}</h1>
              <Badge color={getStatusBadgeColor(verificationRequest.status)}>
                {verificationRequest.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-gray-600">{verificationRequest.restaurantName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Badge color={getPriorityBadgeColor(verificationRequest.priority)}>
            {verificationRequest.priority} Priority
          </Badge>
          {verificationRequest.assignedTo && (
            <Badge color="blue" variant="outline">
              Assigned to: {verificationRequest.assignedTo}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {(verificationRequest.status === 'IN_REVIEW' || verificationRequest.status === 'PENDING') && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="default"
              onClick={() => handleOverallDecision('approve')}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={submitting}
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Approve Verification
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={() => setShowRejectionModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={submitting}
            >
              <XCircleIcon className="w-4 h-4 mr-2" />
              Reject Verification
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => handleOverallDecision('request_changes')}
              className="border-orange-600 text-orange-600 hover:bg-orange-50"
              disabled={submitting}
            >
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
              Restaurant Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Restaurant Name</p>
                <p className="text-gray-600">{verificationRequest.restaurantName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Owner Name</p>
                <p className="text-gray-600">{verificationRequest.ownerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-gray-600">{verificationRequest.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-gray-600">{verificationRequest.phone || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Business Type</p>
                <p className="text-gray-600">{verificationRequest.businessDetails.businessType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Established Year</p>
                <p className="text-gray-600">{verificationRequest.businessDetails.establishedYear}</p>
              </div>
              {verificationRequest.businessDetails.businessAddress && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-900">Business Address</p>
                  <p className="text-gray-600">{verificationRequest.businessDetails.businessAddress}</p>
                </div>
              )}
              {verificationRequest.businessDetails.description && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-900">Description</p>
                  <p className="text-gray-600">{verificationRequest.businessDetails.description}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Verification Documents
            </h3>

            {verificationRequest.documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents attached to this verification request.</p>
            ) : (
              <div className="space-y-4">
                {verificationRequest.documents.map((document) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {document.mimeType.startsWith('image/') ? (
                            <PhotoIcon className="w-5 h-5 text-gray-600" />
                          ) : (
                            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{document.type}</h4>
                          <p className="text-sm text-gray-600">{document.fileName}</p>
                          <p className="text-xs text-gray-500">
                            {document.fileSize > 0 && `${formatFileSize(document.fileSize)} • `}
                            Uploaded {format(new Date(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge color={getStatusBadgeColor(document.status)}>
                          {document.status}
                        </Badge>
                      </div>
                    </div>

                    {document.status === 'REJECTED' && document.rejectionReason && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {document.rejectionReason}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="default">
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="default">
                          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>

                      {document.status === 'PENDING' && (
                        <div className="flex space-x-2">
                          <Button
                            variant="default"
                            size="default"
                            onClick={() => handleDocumentAction(document.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="default"
                            size="default"
                            onClick={() => {
                              setSelectedDocument(document.id);
                              setShowRejectionModal(true);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    {document.verifiedBy && document.verifiedAt && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Verified by {document.verifiedBy} on {format(new Date(document.verifiedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Note */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Add Note
            </h3>

            <div className="space-y-3">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="SUCCESS">Success</option>
              </select>

              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add verification note..."
                rows={3}
              />

              <Button onClick={addNote} className="w-full" disabled={!newNote.trim()} size="default" variant="default">
                Add Note
              </Button>
            </div>
          </Card>

          {/* Verification Notes */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Notes</h3>

            {verificationRequest.verificationNotes.length === 0 ? (
              <p className="text-sm text-gray-500">No notes yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {verificationRequest.verificationNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge color={getNoteBadgeColor(note.type)}>
                        {note.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(note.addedAt), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-1">{note.note}</p>
                    <p className="text-xs text-gray-500">By {note.addedBy}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Timeline
            </h3>

            <div className="space-y-4">
              {verificationRequest.timeline.map((event, index) => (
                <div key={event.id} className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    {index < verificationRequest.timeline.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-300 ml-0.5 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{event.action}</p>
                    <p className="text-xs text-gray-600">{event.details}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.performedBy} • {format(new Date(event.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDocument ? 'Reject Document' : 'Reject Verification'}
            </h3>

            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={4}
              className="mb-4"
            />

            <div className="flex space-x-3">
              <Button
                variant="default"
                size="default"
                onClick={() => {
                  if (selectedDocument) {
                    handleDocumentAction(selectedDocument, 'reject', rejectionReason);
                    setSelectedDocument(null);
                  } else {
                    handleOverallDecision('reject', rejectionReason);
                  }
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!rejectionReason.trim() || submitting}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedDocument(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
