'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  DocumentCheckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

interface VerificationRequest {
  id: string
  type: 'restaurant' | 'employee' | 'vendor'
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_more_info'
  priority: 'low' | 'medium' | 'high'
  applicant: {
    id: string
    name: string
    email: string
    phone: string
    businessName?: string
    location: string
    joinedAt: string
  }
  documents: {
    id: string
    type: 'business_license' | 'fssai_license' | 'pan_card' | 'identity_proof' | 'address_proof' | 'bank_statement' | 'gst_certificate' | 'photos'
    name: string
    status: 'pending' | 'verified' | 'rejected'
    url: string
    uploadedAt: string
    notes?: string
  }[]
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
  verificationScore: number
  riskLevel: 'low' | 'medium' | 'high'
}

const mockVerifications: VerificationRequest[] = [
  {
    id: 'VER-001',
    type: 'restaurant',
    status: 'pending',
    priority: 'high',
    applicant: {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh@spicehaven.com',
      phone: '+91 98765 43210',
      businessName: 'Spice Haven Restaurant',
      location: 'Mumbai, Maharashtra',
      joinedAt: '2024-01-15T10:00:00Z'
    },
    documents: [
      {
        id: 'DOC-001',
        type: 'business_license',
        name: 'Business Registration Certificate.pdf',
        status: 'pending',
        url: '/documents/business_license.pdf',
        uploadedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'DOC-002',
        type: 'fssai_license',
        name: 'FSSAI License.pdf',
        status: 'pending',
        url: '/documents/fssai.pdf',
        uploadedAt: '2024-01-15T10:32:00Z'
      },
      {
        id: 'DOC-003',
        type: 'photos',
        name: 'Restaurant Photos.zip',
        status: 'pending',
        url: '/documents/photos.zip',
        uploadedAt: '2024-01-15T10:35:00Z'
      }
    ],
    submittedAt: '2024-01-15T10:00:00Z',
    verificationScore: 85,
    riskLevel: 'low'
  },
  {
    id: 'VER-002',
    type: 'restaurant',
    status: 'under_review',
    priority: 'medium',
    applicant: {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@urbanbites.com',
      phone: '+91 87654 32109',
      businessName: 'Urban Bites Cafe',
      location: 'Delhi, NCR',
      joinedAt: '2024-01-14T15:00:00Z'
    },
    documents: [
      {
        id: 'DOC-004',
        type: 'business_license',
        name: 'Business License.pdf',
        status: 'verified',
        url: '/documents/business_license2.pdf',
        uploadedAt: '2024-01-14T15:30:00Z'
      },
      {
        id: 'DOC-005',
        type: 'fssai_license',
        name: 'FSSAI Certificate.pdf',
        status: 'rejected',
        url: '/documents/fssai2.pdf',
        uploadedAt: '2024-01-14T15:32:00Z',
        notes: 'License appears to be expired. Please upload current license.'
      },
      {
        id: 'DOC-006',
        type: 'gst_certificate',
        name: 'GST Registration.pdf',
        status: 'verified',
        url: '/documents/gst.pdf',
        uploadedAt: '2024-01-14T15:35:00Z'
      }
    ],
    submittedAt: '2024-01-14T15:00:00Z',
    reviewedAt: '2024-01-14T16:30:00Z',
    reviewedBy: 'Admin John',
    verificationScore: 72,
    riskLevel: 'medium'
  },
  {
    id: 'VER-003',
    type: 'vendor',
    status: 'approved',
    priority: 'low',
    applicant: {
      id: '3',
      name: 'Amit Patel',
      email: 'amit@freshsupplies.com',
      phone: '+91 76543 21098',
      businessName: 'Fresh Farm Supplies',
      location: 'Pune, Maharashtra',
      joinedAt: '2024-01-10T09:00:00Z'
    },
    documents: [
      {
        id: 'DOC-007',
        type: 'business_license',
        name: 'Business Registration.pdf',
        status: 'verified',
        url: '/documents/business_license3.pdf',
        uploadedAt: '2024-01-10T09:30:00Z'
      },
      {
        id: 'DOC-008',
        type: 'fssai_license',
        name: 'FSSAI License.pdf',
        status: 'verified',
        url: '/documents/fssai3.pdf',
        uploadedAt: '2024-01-10T09:32:00Z'
      }
    ],
    submittedAt: '2024-01-10T09:00:00Z',
    reviewedAt: '2024-01-12T14:00:00Z',
    reviewedBy: 'Admin Sarah',
    notes: 'All documents verified successfully. Business appears legitimate.',
    verificationScore: 95,
    riskLevel: 'low'
  }
]

export default function RestaurantVerification() {
  const [verifications, setVerifications] = useState(mockVerifications)
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'under_review': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'requires_more_info': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'verified': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredVerifications = verifications.filter(verification => {
    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter
    const matchesType = typeFilter === 'all' || verification.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || verification.priority === priorityFilter
    const matchesSearch = !searchQuery || 
      verification.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.applicant.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verification.applicant.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesType && matchesPriority && matchesSearch
  })

  const handleApprove = (verificationId: string) => {
    if (confirm('Are you sure you want to approve this verification?')) {
      setVerifications(prev => prev.map(v => 
        v.id === verificationId 
          ? { ...v, status: 'approved' as VerificationRequest['status'], reviewedAt: new Date().toISOString(), reviewedBy: 'Current Admin' }
          : v
      ))
    }
  }

  const handleReject = (verificationId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      setVerifications(prev => prev.map(v => 
        v.id === verificationId 
          ? { ...v, status: 'rejected' as VerificationRequest['status'], reviewedAt: new Date().toISOString(), reviewedBy: 'Current Admin', notes: reason }
          : v
      ))
    }
  }

  const handleDocumentStatusChange = (docId: string, newStatus: 'verified' | 'rejected') => {
    if (selectedVerification) {
      const updatedDocs = selectedVerification.documents.map(doc =>
        doc.id === docId ? { ...doc, status: newStatus } : doc
      )
      
      const updatedVerification = { ...selectedVerification, documents: updatedDocs }
      setSelectedVerification(updatedVerification)
      
      setVerifications(prev => prev.map(v => 
        v.id === selectedVerification.id ? updatedVerification : v
      ))
    }
  }

  if (selectedVerification) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back to Verifications</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Verification Review</h1>
                  <p className="text-gray-600">{selectedVerification.id} - {selectedVerification.applicant.businessName}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedVerification.priority)}`}>
                  {selectedVerification.priority.toUpperCase()} Priority
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedVerification.status)}`}>
                  {selectedVerification.status.replace('_', ' ').toUpperCase()}
                </span>
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">Score: {selectedVerification.verificationScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Applicant Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <p className="text-gray-900 font-medium">{selectedVerification.applicant.businessName}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner/Contact Person</label>
                    <p className="text-gray-900">{selectedVerification.applicant.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedVerification.applicant.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{selectedVerification.applicant.phone}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="text-gray-900">{selectedVerification.applicant.location}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Type</label>
                    <p className="text-gray-900 capitalize">{selectedVerification.type}</p>
                  </div>
                </div>
              </div>

              {/* Documents Review */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents Review</h2>
                
                <div className="space-y-4">
                  {selectedVerification.documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="w-6 h-6 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{doc.type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDocumentStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                          
                          {doc.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDocumentStatusChange(doc.id, 'verified')}
                                className="text-green-600 hover:text-green-800"
                              >
                                <CheckCircleIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDocumentStatusChange(doc.id, 'rejected')}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircleIcon className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                          
                          <button className="text-blue-600 hover:text-blue-800">
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p>Uploaded: {formatDate(doc.uploadedAt)}</p>
                        {doc.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-yellow-800">{doc.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Notes</h2>
                <textarea
                  className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your review notes here..."
                  defaultValue={selectedVerification.notes}
                />
                <div className="mt-4 flex justify-end">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Save Notes
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => handleApprove(selectedVerification.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    disabled={selectedVerification.status === 'approved'}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(selectedVerification.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    disabled={selectedVerification.status === 'rejected'}
                  >
                    Reject
                  </button>
                  <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                    Request More Info
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Contact Applicant
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Verification Score */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Score</h3>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-900">{selectedVerification.verificationScore}/100</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${selectedVerification.verificationScore}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Document Completeness</span>
                    <span>90%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Information Accuracy</span>
                    <span>85%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Business Legitimacy</span>
                    <span>80%</span>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700">Risk Level</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(selectedVerification.riskLevel)}`}>
                    {selectedVerification.riskLevel.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• All required documents submitted</p>
                  <p>• Business registration verified</p>
                  <p>• Contact information validated</p>
                  <p>• No fraud alerts detected</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Account Created</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedVerification.applicant.joinedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Verification Submitted</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedVerification.submittedAt)}</p>
                    </div>
                  </div>
                  {selectedVerification.reviewedAt && (
                    <div className="flex items-center space-x-3">
                      <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Review Started</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedVerification.reviewedAt)}</p>
                        <p className="text-xs text-gray-500">by {selectedVerification.reviewedBy}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center space-x-2">
                    <EyeIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">View Profile</span>
                  </button>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center space-x-2">
                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Call Applicant</span>
                  </button>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center space-x-2">
                    <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Send Email</span>
                  </button>
                  <button className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center space-x-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Flag for Review</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Verification</h1>
              <p className="text-gray-600">Review and approve business verification requests</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg">
                <span className="font-medium">{verifications.filter(v => v.status === 'pending').length}</span> Pending
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                <span className="font-medium">{verifications.filter(v => v.status === 'under_review').length}</span> Under Review
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search verifications..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="requires_more_info">Requires More Info</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="restaurant">Restaurant</option>
                <option value="employee">Employee</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Verifications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVerifications.map((verification) => (
                  <tr key={verification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="w-4 h-4 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{verification.id}</div>
                          <div className="text-xs text-gray-500">{verification.applicant.businessName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{verification.applicant.name}</div>
                        <div className="text-xs text-gray-500">{verification.applicant.email}</div>
                        <div className="text-xs text-gray-500">{verification.applicant.location}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        verification.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                        verification.type === 'employee' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {verification.type.charAt(0).toUpperCase() + verification.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{verification.documents.length}</span>
                        <span className="text-xs text-gray-500 ml-1">docs</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{verification.verificationScore}/100</div>
                        <div className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(verification.riskLevel)}`}>
                          {verification.riskLevel}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(verification.status)}`}>
                        {verification.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(verification.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedVerification(verification)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {verification.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(verification.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReject(verification.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredVerifications.length === 0 && (
            <div className="text-center py-8">
              <DocumentCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No verification requests found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}