'use client'

import React, { useState } from 'react'
import { 
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  StarIcon,
  TrophyIcon,
  CameraIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { 
  StarIcon as StarSolidIcon,
  ShieldCheckIcon as ShieldCheckSolidIcon
} from '@heroicons/react/24/solid'

interface VerificationStatus {
  id: string
  category: string
  items: VerificationItem[]
  completionPercentage: number
  requiredForVerification: boolean
}

interface VerificationItem {
  id: string
  name: string
  status: 'verified' | 'pending' | 'rejected' | 'missing'
  uploadedDate?: string
  expiryDate?: string
  rejectionReason?: string
  documentUrl?: string
  required: boolean
}

interface TrustScoreMetric {
  category: string
  score: number
  maxScore: number
  details: TrustScoreDetail[]
}

interface TrustScoreDetail {
  factor: string
  points: number
  maxPoints: number
  status: 'good' | 'average' | 'poor'
  description: string
}

interface VerificationBadge {
  id: string
  name: string
  description: string
  earned: boolean
  earnedDate?: string
  requirements: string[]
  benefits: string[]
  color: string
}

const mockVerificationData: VerificationStatus[] = [
  {
    id: 'business-docs',
    category: 'Business Documents',
    completionPercentage: 85,
    requiredForVerification: true,
    items: [
      {
        id: 'gst',
        name: 'GST Certificate',
        status: 'verified',
        uploadedDate: '2024-01-15',
        expiryDate: '2025-01-15',
        required: true,
        documentUrl: '/docs/gst-cert.pdf'
      },
      {
        id: 'fssai',
        name: 'FSSAI License',
        status: 'verified',
        uploadedDate: '2024-01-10',
        expiryDate: '2025-01-10',
        required: true,
        documentUrl: '/docs/fssai-license.pdf'
      },
      {
        id: 'business-license',
        name: 'Business License',
        status: 'pending',
        uploadedDate: '2024-01-20',
        required: true,
        documentUrl: '/docs/business-license.pdf'
      },
      {
        id: 'pan',
        name: 'PAN Card',
        status: 'verified',
        uploadedDate: '2024-01-12',
        required: true,
        documentUrl: '/docs/pan-card.pdf'
      },
      {
        id: 'bank-statement',
        name: 'Bank Statement',
        status: 'missing',
        required: true
      }
    ]
  },
  {
    id: 'owner-docs',
    category: 'Owner Verification',
    completionPercentage: 100,
    requiredForVerification: true,
    items: [
      {
        id: 'owner-aadhar',
        name: 'Owner Aadhar Card',
        status: 'verified',
        uploadedDate: '2024-01-08',
        required: true,
        documentUrl: '/docs/owner-aadhar.pdf'
      },
      {
        id: 'owner-photo',
        name: 'Owner Photo Verification',
        status: 'verified',
        uploadedDate: '2024-01-08',
        required: true
      }
    ]
  },
  {
    id: 'location-verification',
    category: 'Location Verification',
    completionPercentage: 75,
    requiredForVerification: false,
    items: [
      {
        id: 'address-proof',
        name: 'Address Proof',
        status: 'verified',
        uploadedDate: '2024-01-14',
        required: true,
        documentUrl: '/docs/address-proof.pdf'
      },
      {
        id: 'location-photos',
        name: 'Restaurant Photos',
        status: 'verified',
        uploadedDate: '2024-01-16',
        required: false
      },
      {
        id: 'google-verification',
        name: 'Google My Business',
        status: 'pending',
        required: false
      }
    ]
  }
]

const mockTrustScore: TrustScoreMetric[] = [
  {
    category: 'Document Verification',
    score: 85,
    maxScore: 100,
    details: [
      { factor: 'Business License', points: 25, maxPoints: 25, status: 'good', description: 'All business documents verified' },
      { factor: 'Owner Identity', points: 20, maxPoints: 20, status: 'good', description: 'Owner identity confirmed' },
      { factor: 'Location Proof', points: 18, maxPoints: 20, status: 'average', description: 'Location verified, photos pending' },
      { factor: 'Financial Records', points: 15, maxPoints: 20, status: 'poor', description: 'Bank statement missing' },
      { factor: 'Compliance History', points: 17, maxPoints: 15, status: 'good', description: 'Clean compliance record' }
    ]
  },
  {
    category: 'Business Performance',
    score: 78,
    maxScore: 100,
    details: [
      { factor: 'Order Completion Rate', points: 24, maxPoints: 25, status: 'good', description: '96% order completion rate' },
      { factor: 'Customer Satisfaction', points: 22, maxPoints: 25, status: 'good', description: '4.6/5 average rating' },
      { factor: 'Payment Reliability', points: 20, maxPoints: 20, status: 'good', description: 'No payment defaults' },
      { factor: 'Vendor Relations', points: 12, maxPoints: 15, status: 'average', description: 'Good vendor feedback' },
      { factor: 'Community Engagement', points: 8, maxPoints: 15, status: 'poor', description: 'Low community participation' }
    ]
  },
  {
    category: 'Platform Activity',
    score: 72,
    maxScore: 100,
    details: [
      { factor: 'Profile Completeness', points: 23, maxPoints: 25, status: 'good', description: 'Profile 92% complete' },
      { factor: 'Regular Updates', points: 18, maxPoints: 20, status: 'average', description: 'Updates profile monthly' },
      { factor: 'Response Time', points: 15, maxPoints: 20, status: 'average', description: 'Average 2-hour response time' },
      { factor: 'Platform Usage', points: 16, maxPoints: 20, status: 'average', description: 'Active across most features' },
      { factor: 'Referrals & Reviews', points: 5, maxPoints: 15, status: 'poor', description: 'Few referrals generated' }
    ]
  }
]

const mockBadges: VerificationBadge[] = [
  {
    id: 'verified-restaurant',
    name: 'Verified Restaurant',
    description: 'Complete business verification with all required documents',
    earned: true,
    earnedDate: '2024-01-20',
    requirements: ['GST Certificate', 'FSSAI License', 'Business License', 'Owner Identity'],
    benefits: ['Higher search ranking', 'Trust badge display', 'Priority support'],
    color: 'blue'
  },
  {
    id: 'trusted-employer',
    name: 'Trusted Employer',
    description: 'Excellent track record in employee relations and hiring',
    earned: false,
    requirements: ['10+ successful hires', '4.5+ employer rating', 'No fraud reports'],
    benefits: ['Featured in job listings', 'Access to premium candidates', 'Reduced hiring fees'],
    color: 'green'
  },
  {
    id: 'premium-vendor',
    name: 'Premium B2B Vendor',
    description: 'Top-rated seller in the marketplace with excellent service',
    earned: false,
    requirements: ['50+ successful transactions', '4.8+ vendor rating', 'Fast shipping'],
    benefits: ['Featured listings', 'Reduced commission', 'Marketing support'],
    color: 'purple'
  },
  {
    id: 'community-leader',
    name: 'Community Leader',
    description: 'Active contributor to the restaurant community',
    earned: true,
    earnedDate: '2024-02-01',
    requirements: ['50+ helpful posts', '100+ community interactions', '4.5+ community rating'],
    benefits: ['Moderator privileges', 'Featured content', 'Exclusive events access'],
    color: 'orange'
  }
]

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDocument, setSelectedDocument] = useState<VerificationItem | null>(null)

  const overallTrustScore = Math.round(
    mockTrustScore.reduce((sum, metric) => sum + metric.score, 0) / mockTrustScore.length
  )

  const overallCompletion = Math.round(
    mockVerificationData.reduce((sum, category) => sum + category.completionPercentage, 0) / mockVerificationData.length
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      case 'missing': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Trust Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <ShieldCheckSolidIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overall Trust Score</p>
              <div className="flex items-baseline space-x-2">
                <p className={`text-2xl font-semibold ${getTrustScoreColor(overallTrustScore)}`}>
                  {overallTrustScore}/100
                </p>
                <div className="flex items-center text-green-600">
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">+5 this month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <CheckBadgeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Verification Status</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-semibold text-gray-900">{overallCompletion}%</p>
                <span className="text-sm text-gray-500">Complete</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Badges Earned</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-semibold text-gray-900">
                  {mockBadges.filter(badge => badge.earned).length}
                </p>
                <span className="text-sm text-gray-500">of {mockBadges.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Categories */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Categories</h3>
        <div className="space-y-6">
          {mockVerificationData.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  {category.requiredForVerification && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {category.completionPercentage}% Complete
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${category.completionPercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'verified' ? 'bg-green-500' :
                        item.status === 'pending' ? 'bg-yellow-500' :
                        item.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.uploadedDate && (
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(item.uploadedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      {item.documentUrl ? (
                        <button
                          onClick={() => setSelectedDocument(item)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button className="p-1 text-blue-600 hover:text-blue-700">
                          <ArrowUpTrayIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Improve Your Trust Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900">Upload Missing Documents</h4>
              <p className="text-sm text-blue-700">Complete your business verification to earn trust points.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <UserGroupIcon className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900">Engage with Community</h4>
              <p className="text-sm text-blue-700">Participate in forums and help other restaurants.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTrustScore = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Trust Score Breakdown</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Overall Score:</span>
            <span className={`text-2xl font-bold ${getTrustScoreColor(overallTrustScore)}`}>
              {overallTrustScore}/100
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {mockTrustScore.map((metric) => (
            <div key={metric.category}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{metric.category}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${getTrustScoreColor(metric.score)}`}>
                    {metric.score}/{metric.maxScore}
                  </span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        metric.score >= 85 ? 'bg-green-500' :
                        metric.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(metric.score / metric.maxScore) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {metric.details.map((detail, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        detail.status === 'good' ? 'bg-green-500' :
                        detail.status === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{detail.factor}</p>
                        <p className="text-sm text-gray-600">{detail.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {detail.points}/{detail.maxPoints}
                      </p>
                      <p className={`text-xs ${
                        detail.status === 'good' ? 'text-green-600' :
                        detail.status === 'average' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {detail.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderBadges = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Badges</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockBadges.map((badge) => (
            <div
              key={badge.id}
              className={`border-2 rounded-lg p-6 ${
                badge.earned
                  ? `border-${badge.color}-200 bg-${badge.color}-50`
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                  badge.earned
                    ? `bg-${badge.color}-100`
                    : 'bg-gray-100'
                }`}>
                  {badge.earned ? (
                    <CheckBadgeIcon className={`h-6 w-6 text-${badge.color}-600`} />
                  ) : (
                    <ClockIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{badge.name}</h4>
                    {badge.earned && (
                      <span className={`px-2 py-1 text-xs rounded-full bg-${badge.color}-100 text-${badge.color}-800`}>
                        Earned
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{badge.description}</p>
                  
                  {badge.earnedDate && (
                    <p className="text-xs text-gray-500 mb-3">
                      Earned on {new Date(badge.earnedDate).toLocaleDateString()}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {badge.requirements.map((req, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            {badge.earned ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 border border-gray-300 rounded-full" />
                            )}
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Benefits:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {badge.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderDocumentModal = () => {
    if (!selectedDocument) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{selectedDocument.name}</h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedDocument.status)}`}>
                  {selectedDocument.status}
                </span>
                {selectedDocument.uploadedDate && (
                  <span className="text-sm text-gray-500">
                    Uploaded: {new Date(selectedDocument.uploadedDate).toLocaleDateString()}
                  </span>
                )}
                {selectedDocument.expiryDate && (
                  <span className="text-sm text-gray-500">
                    Expires: {new Date(selectedDocument.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>

              {selectedDocument.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">Rejection Reason</h4>
                      <p className="text-sm text-red-700">{selectedDocument.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Document preview would appear here</p>
                {selectedDocument.documentUrl && (
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Download Document
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                {selectedDocument.status !== 'verified' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Re-upload Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Verification & Trust Score</h1>
        <p className="text-gray-600 mt-2">Manage your verification status and build trust in the community</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trust-score')}
            className={`pb-2 px-1 ${activeTab === 'trust-score' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Trust Score Details
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-2 px-1 ${activeTab === 'badges' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            Verification Badges
          </button>
        </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'trust-score' && renderTrustScore()}
      {activeTab === 'badges' && renderBadges()}

      {renderDocumentModal()}
    </div>
  )
}