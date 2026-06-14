'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  StarIcon,
  PhotoIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ArrowLeftIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'

interface ModerationItem {
  id: string
  type: 'profile' | 'review' | 'job_post' | 'message' | 'photo' | 'comment'
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  content: {
    title?: string
    text?: string
    imageUrl?: string
    rating?: number
  }
  author: {
    id: string
    name: string
    email: string
    type: 'restaurant' | 'employee' | 'vendor'
    avatar?: string
  }
  target?: {
    id: string
    name: string
    type: 'restaurant' | 'employee' | 'vendor'
  }
  flags: {
    id: string
    reason: 'inappropriate' | 'spam' | 'fake' | 'offensive' | 'copyright' | 'harassment' | 'other'
    reporter: {
      id: string
      name: string
      type: 'restaurant' | 'employee' | 'vendor'
    }
    description: string
    timestamp: string
  }[]
  aiScore: number
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: string
  moderatedAt?: string
  moderatedBy?: string
  moderationNotes?: string
}

const mockModerationItems: ModerationItem[] = [
  {
    id: 'MOD-001',
    type: 'review',
    status: 'pending',
    content: {
      title: 'Terrible experience!',
      text: 'This restaurant is absolutely horrible. The food was disgusting and the staff were rude. I would never recommend this place to anyone. Complete waste of money!',
      rating: 1
    },
    author: {
      id: '1',
      name: 'Angry Customer',
      email: 'angry@email.com',
      type: 'employee'
    },
    target: {
      id: '2',
      name: 'Spice Haven Restaurant',
      type: 'restaurant'
    },
    flags: [
      {
        id: 'FLAG-001',
        reason: 'inappropriate',
        reporter: {
          id: '2',
          name: 'Spice Haven Restaurant',
          type: 'restaurant'
        },
        description: 'This review seems to be written by a competitor trying to damage our reputation. The language is unnecessarily harsh and unprofessional.',
        timestamp: '2024-01-15T10:30:00Z'
      }
    ],
    aiScore: 75,
    riskLevel: 'medium',
    createdAt: '2024-01-14T18:45:00Z'
  },
  {
    id: 'MOD-002',
    type: 'job_post',
    status: 'flagged',
    content: {
      title: 'Looking for young attractive waitresses only',
      text: 'We are looking for young, attractive female waitresses between ages 18-25. Must be single and available for late night shifts. Good tips guaranteed for the right candidates.'
    },
    author: {
      id: '3',
      name: 'Questionable Restaurant',
      email: 'hr@questionable.com',
      type: 'restaurant'
    },
    flags: [
      {
        id: 'FLAG-002',
        reason: 'inappropriate',
        reporter: {
          id: '4',
          name: 'Sarah Johnson',
          type: 'employee'
        },
        description: 'This job posting contains discriminatory language and inappropriate requirements based on age, gender, and marital status.',
        timestamp: '2024-01-15T09:15:00Z'
      },
      {
        id: 'FLAG-003',
        reason: 'harassment',
        reporter: {
          id: '5',
          name: 'Maria Garcia',
          type: 'employee'
        },
        description: 'This posting seems to be targeting women inappropriately and could lead to harassment.',
        timestamp: '2024-01-15T11:20:00Z'
      }
    ],
    aiScore: 95,
    riskLevel: 'high',
    createdAt: '2024-01-14T14:20:00Z'
  },
  {
    id: 'MOD-003',
    type: 'photo',
    status: 'pending',
    content: {
      imageUrl: '/uploads/restaurant_photo.jpg'
    },
    author: {
      id: '6',
      name: 'New Bistro',
      email: 'photos@newbistro.com',
      type: 'restaurant'
    },
    flags: [
      {
        id: 'FLAG-004',
        reason: 'copyright',
        reporter: {
          id: '7',
          name: 'Original Restaurant',
          type: 'restaurant'
        },
        description: 'This photo was stolen from our restaurant\'s official website. They are using our interior photos to misrepresent their business.',
        timestamp: '2024-01-15T16:00:00Z'
      }
    ],
    aiScore: 60,
    riskLevel: 'medium',
    createdAt: '2024-01-15T12:30:00Z'
  },
  {
    id: 'MOD-004',
    type: 'profile',
    status: 'approved',
    content: {
      title: 'Executive Chef Profile',
      text: 'Experienced executive chef with 15 years in fine dining. Specializing in French and Italian cuisine. Previously worked at Michelin-starred restaurants.'
    },
    author: {
      id: '8',
      name: 'Chef Antoine',
      email: 'chef.antoine@email.com',
      type: 'employee'
    },
    flags: [
      {
        id: 'FLAG-005',
        reason: 'fake',
        reporter: {
          id: '9',
          name: 'Former Colleague',
          type: 'employee'
        },
        description: 'This person is claiming experience they don\'t have. They worked as a line cook, not executive chef.',
        timestamp: '2024-01-13T14:45:00Z'
      }
    ],
    aiScore: 40,
    riskLevel: 'low',
    createdAt: '2024-01-12T09:00:00Z',
    moderatedAt: '2024-01-13T16:30:00Z',
    moderatedBy: 'Admin Sarah',
    moderationNotes: 'Verified credentials with previous employers. Profile is accurate.'
  }
]

export default function ContentModeration() {
  const [items, setItems] = useState(mockModerationItems)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'flagged': return 'bg-orange-100 text-orange-800'
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'profile': return 'Profile'
      case 'review': return 'Review'
      case 'job_post': return 'Job Post'
      case 'message': return 'Message'
      case 'photo': return 'Photo'
      case 'comment': return 'Comment'
      default: return type
    }
  }

  const getFlagReasonLabel = (reason: string) => {
    switch (reason) {
      case 'inappropriate': return 'Inappropriate Content'
      case 'spam': return 'Spam'
      case 'fake': return 'Fake/Misleading'
      case 'offensive': return 'Offensive Language'
      case 'copyright': return 'Copyright Violation'
      case 'harassment': return 'Harassment'
      case 'other': return 'Other'
      default: return reason
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

  const filteredItems = items.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesRisk = riskFilter === 'all' || item.riskLevel === riskFilter
    const matchesSearch = !searchQuery || 
      item.content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesType && matchesRisk && matchesSearch
  })

  const handleApprove = (itemId: string) => {
    if (confirm('Are you sure you want to approve this content?')) {
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: 'approved' as ModerationItem['status'], 
              moderatedAt: new Date().toISOString(), 
              moderatedBy: 'Current Admin'
            }
          : item
      ))
    }
  }

  const handleReject = (itemId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason) {
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: 'rejected' as ModerationItem['status'], 
              moderatedAt: new Date().toISOString(), 
              moderatedBy: 'Current Admin',
              moderationNotes: reason
            }
          : item
      ))
    }
  }

  const renderContent = (item: ModerationItem) => {
    switch (item.type) {
      case 'photo':
        return (
          <div className="flex items-center justify-center w-full h-48 bg-gray-100 rounded-lg">
            <PhotoIcon className="w-12 h-12 text-gray-400" />
            <span className="ml-2 text-gray-500">Image Content</span>
          </div>
        )
      case 'review':
        return (
          <div>
            <div className="flex items-center mb-2">
              {item.content.rating && (
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-4 h-4 ${
                        i < item.content.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">{item.content.rating}/5</span>
                </div>
              )}
            </div>
            {item.content.title && (
              <h4 className="font-medium text-gray-900 mb-2">{item.content.title}</h4>
            )}
            <p className="text-gray-700 text-sm">{item.content.text}</p>
          </div>
        )
      default:
        return (
          <div>
            {item.content.title && (
              <h4 className="font-medium text-gray-900 mb-2">{item.content.title}</h4>
            )}
            <p className="text-gray-700 text-sm">{item.content.text}</p>
          </div>
        )
    }
  }

  if (selectedItem) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back to Moderation</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Content Review</h1>
                  <p className="text-gray-600">{selectedItem.id} - {getTypeLabel(selectedItem.type)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(selectedItem.riskLevel)}`}>
                  {selectedItem.riskLevel.toUpperCase()} Risk
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedItem.status)}`}>
                  {selectedItem.status.toUpperCase()}
                </span>
                <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">AI Score: {selectedItem.aiScore}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Content to Review */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Content to Review</h2>
                {renderContent(selectedItem)}
              </div>

              {/* Flags */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Flags & Reports</h2>
                <div className="space-y-4">
                  {selectedItem.flags.map((flag) => (
                    <div key={flag.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <FlagIcon className="w-4 h-4 text-red-500" />
                            <span className="font-medium text-gray-900">
                              {getFlagReasonLabel(flag.reason)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Reported by {flag.reporter.name} ({flag.reporter.type})
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(flag.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{flag.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moderation Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Moderation Notes</h2>
                <textarea
                  className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your moderation notes here..."
                  defaultValue={selectedItem.moderationNotes}
                />
                <div className="mt-4 flex justify-end">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Save Notes
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Moderation Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => handleApprove(selectedItem.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    disabled={selectedItem.status === 'approved'}
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(selectedItem.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    disabled={selectedItem.status === 'rejected'}
                  >
                    Reject
                  </button>
                  <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
                    Request Edit
                  </button>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    Escalate
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Author Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Author Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedItem.author.name}</p>
                      <p className="text-sm text-gray-600">{selectedItem.author.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedItem.author.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                    selectedItem.author.type === 'employee' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedItem.author.type.charAt(0).toUpperCase() + selectedItem.author.type.slice(1)}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <button className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                    View Full Profile
                  </button>
                </div>
              </div>

              {/* Target Information */}
              {selectedItem.target && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Target</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedItem.target.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{selectedItem.target.type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Analysis</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Risk Score</span>
                      <span className="text-sm font-bold text-gray-900">{selectedItem.aiScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedItem.aiScore >= 80 ? 'bg-red-500' :
                          selectedItem.aiScore >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${selectedItem.aiScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sentiment</span>
                      <span className={selectedItem.type === 'review' && selectedItem.content.rating && selectedItem.content.rating <= 2 ? 'text-red-600' : 'text-green-600'}>
                        {selectedItem.type === 'review' && selectedItem.content.rating && selectedItem.content.rating <= 2 ? 'Negative' : 'Neutral'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Language Quality</span>
                      <span className="text-gray-900">Good</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spam Probability</span>
                      <span className="text-gray-900">Low</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Content Created</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedItem.createdAt)}</p>
                    </div>
                  </div>
                  
                  {selectedItem.flags.map((flag) => (
                    <div key={flag.id} className="flex items-center space-x-3">
                      <FlagIcon className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Flagged</p>
                        <p className="text-xs text-gray-600">{formatDate(flag.timestamp)}</p>
                      </div>
                    </div>
                  ))}

                  {selectedItem.moderatedAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Moderated</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedItem.moderatedAt)}</p>
                        <p className="text-xs text-gray-500">by {selectedItem.moderatedBy}</p>
                      </div>
                    </div>
                  )}
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
              <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
              <p className="text-gray-600">Review flagged content and user reports</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                <span className="font-medium">{items.filter(i => i.status === 'pending').length}</span> Pending
              </div>
              <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded-lg">
                <span className="font-medium">{items.filter(i => i.status === 'flagged').length}</span> Flagged
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
                  placeholder="Search content..."
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
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="flagged">Flagged</option>
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
                <option value="profile">Profile</option>
                <option value="review">Review</option>
                <option value="job_post">Job Post</option>
                <option value="message">Message</option>
                <option value="photo">Photo</option>
                <option value="comment">Comment</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Moderation Items Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.content.title || 'No title'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {item.content.text ? 
                            item.content.text.substring(0, 100) + (item.content.text.length > 100 ? '...' : '') :
                            item.type === 'photo' ? 'Image content' : 'No content'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.author.name}</div>
                        <div className="text-sm text-gray-500">{item.author.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getTypeLabel(item.type)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FlagIcon className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-sm text-gray-900">{item.flags.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{item.aiScore}/100</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(item.riskLevel)}`}>
                          {item.riskLevel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(item.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleReject(item.id)}
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
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <ShieldExclamationIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No content found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}