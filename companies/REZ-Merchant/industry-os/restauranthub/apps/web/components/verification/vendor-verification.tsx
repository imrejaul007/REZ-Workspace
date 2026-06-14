'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Check,
  X,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Upload,
  FileText,
  Building2,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Users,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, cn } from '@/lib/utils';

interface Document {
  id: string;
  type: 'business_license' | 'tax_registration' | 'food_safety' | 'insurance' | 'bank_statement' | 'identity_proof' | 'address_proof';
  name: string;
  url: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiryDate?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface VerificationRequest {
  id: string;
  vendorId: string;
  vendor: {
    name: string;
    email: string;
    phone: string;
    businessType: string;
    location: string;
    website?: string;
    foundedYear: string;
  };
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'incomplete';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documents: Document[];
  businessDetails: {
    registrationNumber: string;
    taxId: string;
    businessCategory: string;
    yearlyRevenue?: string;
    employeeCount: number;
    bankAccountDetails: boolean;
  };
  references: {
    name: string;
    company: string;
    contact: string;
    relationship: string;
  }[];
  verificationScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  notes: string[];
  autoChecks: {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    description: string;
  }[];
}

interface VendorVerificationProps {
  requests: VerificationRequest[];
  currentUserRole: 'admin' | 'moderator';
  onApprove: (requestId: string, notes?: string) => void;
  onReject: (requestId: string, reason: string) => void;
  onRequestMoreInfo: (requestId: string, requirements: string[]) => void;
  onViewDocument: (document: Document) => void;
}

const documentTypes = [
  { value: 'business_license', label: 'Business License', required: true },
  { value: 'tax_registration', label: 'Tax Registration', required: true },
  { value: 'food_safety', label: 'Food Safety Certificate', required: true },
  { value: 'insurance', label: 'Business Insurance', required: false },
  { value: 'bank_statement', label: 'Bank Statement', required: true },
  { value: 'identity_proof', label: 'Identity Proof', required: true },
  { value: 'address_proof', label: 'Address Proof', required: true }
];

export default function VendorVerification({
  requests,
  currentUserRole,
  onApprove,
  onReject,
  onRequestMoreInfo,
  onViewDocument
}: VendorVerificationProps) {
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Filter and sort requests
  const filteredRequests = requests.filter(request => {
    const matchesSearch = !searchTerm || 
      request.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.businessDetails.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      case 'oldest':
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'score':
        return b.verificationScore - a.verificationScore;
      default:
        return 0;
    }
  });

  const getStatusColor = (status: VerificationRequest['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'incomplete': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: VerificationRequest['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (risk: VerificationRequest['riskLevel']) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDocumentStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired': return <Clock className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const handleApprove = () => {
    if (selectedRequest) {
      onApprove(selectedRequest.id, approvalNotes);
      setShowApproveModal(false);
      setApprovalNotes('');
      setSelectedRequest(null);
    }
  };

  const handleReject = () => {
    if (selectedRequest && rejectionReason) {
      onReject(selectedRequest.id, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
    }
  };

  const calculateCompleteness = (request: VerificationRequest) => {
    const requiredDocs = documentTypes.filter(dt => dt.required);
    const uploadedRequiredDocs = requiredDocs.filter(docType => 
      request.documents.some(doc => doc.type === docType.value)
    );
    return Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100);
  };

  const renderRequestCard = (request: VerificationRequest) => {
    const completeness = calculateCompleteness(request);

    return (
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="hover:shadow-md transition-all cursor-pointer">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground">{request.vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">{request.vendor.businessType}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={cn('text-xs', getStatusColor(request.status))}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={cn('text-xs', getPriorityColor(request.priority))}>
                        {request.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <span className={cn('text-lg font-bold', getScoreColor(request.verificationScore))}>
                      {request.verificationScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <Badge className={cn('text-xs', getRiskColor(request.riskLevel))}>
                    {request.riskLevel} risk
                  </Badge>
                </div>
              </div>

              {/* Business Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{request.vendor.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Founded</p>
                  <p className="font-medium">{request.vendor.foundedYear}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employees</p>
                  <p className="font-medium">{request.businessDetails.employeeCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration</p>
                  <p className="font-mono text-xs">{request.businessDetails.registrationNumber}</p>
                </div>
              </div>

              {/* Document Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Document Completeness</span>
                  <span className="text-sm text-muted-foreground">{completeness}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      completeness === 100 ? 'bg-green-500' :
                      completeness >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    )}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {/* Auto Checks */}
              <div>
                <p className="text-sm font-medium mb-2">Automated Checks</p>
                <div className="grid grid-cols-2 gap-2">
                  {request.autoChecks.slice(0, 4).map((check, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {check.status === 'passed' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : check.status === 'failed' ? (
                        <X className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-xs text-muted-foreground truncate">{check.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Submitted {formatDate(request.submittedAt)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                  
                  {request.status === 'in_review' && (
                    <>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>

                      <Button
                        variant="default"
                        size="default"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApproveModal(true);
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderDetailedView = (request: VerificationRequest) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Verification Review</h2>
          <p className="text-muted-foreground">Reviewing {request.vendor.name}</p>
        </div>
        
        <Button variant="outline" onClick={() => setSelectedRequest(null)} size="default">
          <X className="h-4 w-4 mr-2" />
          Back to List
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Name</p>
                  <p className="text-foreground">{request.vendor.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Business Type</p>
                  <p className="text-foreground">{request.vendor.businessType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-foreground">{request.vendor.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-foreground">{request.vendor.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-foreground">{request.vendor.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Founded</p>
                  <p className="text-foreground">{request.vendor.foundedYear}</p>
                </div>
              </div>
              
              {request.vendor.website && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  <a href={request.vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {request.vendor.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documentTypes.map((docType) => {
                  const document = request.documents.find(doc => doc.type === docType.value);

                  return (
                    <div key={docType.value} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {docType.label}
                            {docType.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          {document && (
                            <p className="text-sm text-muted-foreground">
                              Uploaded {formatDate(document.uploadedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {document ? (
                          <>
                            {getDocumentStatusIcon(document.status)}
                            <Button
                              variant="outline"
                              size="default"
                              onClick={() => onViewDocument(document)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            Missing
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Business References */}
          <Card>
            <CardHeader>
              <CardTitle>Business References</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {request.references.map((ref, index) => (
                  <div key={index} className="p-3 border border-border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-foreground">{ref.name}</p>
                        <p className="text-sm text-muted-foreground">{ref.relationship}</p>
                      </div>
                      <div>
                        <p className="text-foreground">{ref.company}</p>
                        <p className="text-sm text-muted-foreground">{ref.contact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Verification Score */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Score</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className={cn('text-4xl font-bold mb-2', getScoreColor(request.verificationScore))}>
                {request.verificationScore}
              </div>
              <p className="text-muted-foreground mb-4">out of 100</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Document Completeness</span>
                  <span>{calculateCompleteness(request)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Auto Checks</span>
                  <span>{Math.round((request.autoChecks.filter(c => c.status === 'passed').length / request.autoChecks.length) * 100)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Risk Assessment</span>
                  <Badge className={cn('text-xs', getRiskColor(request.riskLevel))}>
                    {request.riskLevel}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto Checks */}
          <Card>
            <CardHeader>
              <CardTitle>Automated Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {request.autoChecks.map((check, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    {check.status === 'passed' ? (
                      <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : check.status === 'failed' ? (
                      <X className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => setShowApproveModal(true)}
                disabled={request.status !== 'in_review'}
                size="default"
                variant="default"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Vendor
              </Button>

              <Button
                variant="outline"
                className="w-full text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setShowRejectModal(true)}
                disabled={request.status !== 'in_review'}
                size="default"
              >
                <X className="h-4 w-4 mr-2" />
                Reject Application
              </Button>
              
              <Button variant="outline" className="w-full" size="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Request More Info
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendor Verification</h2>
          <p className="text-muted-foreground mt-1">
            Review and verify vendor applications
          </p>
        </div>
      </div>

      {selectedRequest ? (
        renderDetailedView(selectedRequest)
      ) : (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search vendors, email, or registration..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                  
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority">By Priority</option>
                    <option value="score">By Score</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedRequests.map(renderRequestCard)}
          </div>

          {/* Empty State */}
          {sortedRequests.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No verification requests found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Verification requests will appear here when vendors submit applications'
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowApproveModal(false)}
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Approve Vendor</h3>
                
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Are you sure you want to approve {selectedRequest.vendor.name}? 
                    This will grant them access to the marketplace.
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Approval Notes (Optional)</label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add unknown notes for the vendor..."
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setShowApproveModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700"
                      size="default"
                      variant="default"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Vendor
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowRejectModal(false)}
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Reject Application</h3>
                
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Please provide a reason for rejecting {selectedRequest.vendor.name}'s application.
                  </p>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why the application is being rejected..."
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setShowRejectModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="default"
                      onClick={handleReject}
                      disabled={!rejectionReason.trim()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Application
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}