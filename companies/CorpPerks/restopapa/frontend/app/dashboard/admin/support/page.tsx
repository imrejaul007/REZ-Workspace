'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserCircleIcon,
  PaperClipIcon,
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  CalendarDaysIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface SupportTicket {
  id: string
  subject: string
  description: string
  category: 'technical' | 'billing' | 'account' | 'verification' | 'general' | 'bug_report' | 'feature_request'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
  customer: {
    id: string
    name: string
    email: string
    phone?: string
    type: 'restaurant' | 'employee' | 'vendor'
    avatar?: string
  }
  assignedTo?: {
    id: string
    name: string
    avatar?: string
  }
  tags: string[]
  attachments: {
    id: string
    name: string
    url: string
    type: string
    size: number
  }[]
  messages: {
    id: string
    sender: {
      id: string
      name: string
      type: 'customer' | 'admin'
      avatar?: string
    }
    message: string
    timestamp: string
    isInternal?: boolean
  }[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  satisfaction?: {
    rating: number
    feedback?: string
  }
}

const mockTickets: SupportTicket[] = [
  {
    id: 'TK-001',
    subject: 'Payment Failed - Unable to Complete Subscription',
    description: 'I am trying to upgrade to premium subscription but my payment keeps failing even though my card is valid.',
    category: 'billing',
    priority: 'high',
    status: 'open',
    customer: {
      id: '1',
      name: 'Rajesh Kumar',
      email: 'rajesh@spicehaven.com',
      phone: '+91 98765 43210',
      type: 'restaurant'
    },
    tags: ['payment', 'subscription', 'urgent'],
    attachments: [
      {
        id: 'ATT-001',
        name: 'payment_error_screenshot.png',
        url: '/attachments/payment_error.png',
        type: 'image/png',
        size: 156789
      }
    ],
    messages: [
      {
        id: 'MSG-001',
        sender: {
          id: '1',
          name: 'Rajesh Kumar',
          type: 'customer'
        },
        message: 'I have been trying to upgrade my account to premium for the past 2 hours. Every time I enter my payment details and click submit, it shows "Payment failed" error. My card works fine on other websites.',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        id: 'MSG-002',
        sender: {
          id: 'admin1',
          name: 'Support Team',
          type: 'admin'
        },
        message: 'Thank you for contacting us. We are looking into this issue. Can you please try using a different payment method in the meantime?',
        timestamp: '2024-01-15T11:15:00Z'
      }
    ],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T11:15:00Z'
  },
  {
    id: 'TK-002',
    subject: 'Unable to Verify Business Documents',
    description: 'My business verification has been pending for 5 days. I uploaded all required documents but no response yet.',
    category: 'verification',
    priority: 'medium',
    status: 'in_progress',
    customer: {
      id: '2',
      name: 'Sarah Chen',
      email: 'sarah@urbanbites.com',
      phone: '+91 87654 32109',
      type: 'restaurant'
    },
    assignedTo: {
      id: 'admin2',
      name: 'Admin John'
    },
    tags: ['verification', 'documents', 'business'],
    attachments: [],
    messages: [
      {
        id: 'MSG-003',
        sender: {
          id: '2',
          name: 'Sarah Chen',
          type: 'customer'
        },
        message: 'I submitted my business verification 5 days ago but haven\'t heard back. All documents are uploaded correctly. Can you please check the status?',
        timestamp: '2024-01-14T09:20:00Z'
      },
      {
        id: 'MSG-004',
        sender: {
          id: 'admin2',
          name: 'Admin John',
          type: 'admin'
        },
        message: 'Hi Sarah, I\'m reviewing your documents now. Your FSSAI license appears to be expired. Could you please upload the renewed license?',
        timestamp: '2024-01-14T14:30:00Z',
        isInternal: false
      }
    ],
    createdAt: '2024-01-14T09:20:00Z',
    updatedAt: '2024-01-14T14:30:00Z'
  },
  {
    id: 'TK-003',
    subject: 'Feature Request: Bulk Job Posting',
    description: 'Can you add a feature to post multiple job openings at once? Currently I have to create each job individually.',
    category: 'feature_request',
    priority: 'low',
    status: 'resolved',
    customer: {
      id: '3',
      name: 'Amit Sharma',
      email: 'amit@foodcourt.com',
      type: 'restaurant'
    },
    assignedTo: {
      id: 'admin3',
      name: 'Admin Sarah'
    },
    tags: ['feature', 'jobs', 'bulk'],
    attachments: [],
    messages: [
      {
        id: 'MSG-005',
        sender: {
          id: '3',
          name: 'Amit Sharma',
          type: 'customer'
        },
        message: 'I run multiple restaurants and need to post many similar jobs. A bulk posting feature would save a lot of time.',
        timestamp: '2024-01-10T16:45:00Z'
      },
      {
        id: 'MSG-006',
        sender: {
          id: 'admin3',
          name: 'Admin Sarah',
          type: 'admin'
        },
        message: 'Thank you for the suggestion! We\'ve added this to our product roadmap. We\'ll notify you when this feature is available.',
        timestamp: '2024-01-11T10:20:00Z'
      }
    ],
    createdAt: '2024-01-10T16:45:00Z',
    updatedAt: '2024-01-11T10:20:00Z',
    resolvedAt: '2024-01-11T10:20:00Z',
    satisfaction: {
      rating: 4,
      feedback: 'Good response time, looking forward to the feature.'
    }
  }
]

const ticketStats = {
  total: 247,
  open: 45,
  inProgress: 23,
  resolved: 156,
  avgResponseTime: '2.3 hours',
  satisfaction: 4.2
}

export default function SupportTickets() {
  const [tickets, setTickets] = useState(mockTickets)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'waiting_customer': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return 'Technical'
      case 'billing': return 'Billing'
      case 'account': return 'Account'
      case 'verification': return 'Verification'
      case 'general': return 'General'
      case 'bug_report': return 'Bug Report'
      case 'feature_request': return 'Feature Request'
      default: return category
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

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Byte'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString())
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    const matchesSearch = !searchQuery || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesCategory && matchesPriority && matchesSearch
  })

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: newStatus as SupportTicket['status'], updatedAt: new Date().toISOString() }
        : ticket
    ))
  }

  const handleAssignTicket = (ticketId: string, adminId: string, adminName: string) => {
    setTickets(prev => prev.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, assignedTo: { id: adminId, name: adminName }, updatedAt: new Date().toISOString() }
        : ticket
    ))
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedTicket) {
      const message = {
        id: `MSG-${Date.now()}`,
        sender: {
          id: 'current-admin',
          name: 'Support Admin',
          type: 'admin' as const
        },
        message: newMessage,
        timestamp: new Date().toISOString()
      }

      const updatedTicket = {
        ...selectedTicket,
        messages: [...selectedTicket.messages, message],
        updatedAt: new Date().toISOString()
      }

      setSelectedTicket(updatedTicket)
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t))
      setNewMessage('')
    }
  }

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back to Tickets</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Support Ticket</h1>
                  <p className="text-gray-600">{selectedTicket.id} - {selectedTicket.subject}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Messages */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Conversation</h2>
                </div>
                
                <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender.type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender.type === 'admin' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {message.sender.name}
                          </span>
                          <span className={`text-xs ${
                            message.sender.type === 'admin' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                        {message.isInternal && (
                          <div className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Internal Note
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-6 border-t">
                  <div className="flex space-x-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      placeholder="Type your response..."
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-600">Internal note (not visible to customer)</span>
                    </label>
                    
                    <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1">
                      <PaperClipIcon className="w-4 h-4" />
                      <span>Attach file</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedTicket.customer.name}</p>
                      <p className="text-sm text-gray-600">{selectedTicket.customer.email}</p>
                    </div>
                  </div>
                  
                  {selectedTicket.customer.phone && (
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600">{selectedTicket.customer.phone}</span>
                    </div>
                  )}

                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTicket.customer.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                    selectedTicket.customer.type === 'employee' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedTicket.customer.type.charAt(0).toUpperCase() + selectedTicket.customer.type.slice(1)}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t flex space-x-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                    Call Customer
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-50">
                    View Profile
                  </button>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_customer">Waiting Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                      value={selectedTicket.assignedTo?.id || ''}
                      onChange={(e) => {
                        const adminName = e.target.options[e.target.selectedIndex].text
                        handleAssignTicket(selectedTicket.id, e.target.value, adminName)
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      <option value="admin1">Admin John</option>
                      <option value="admin2">Admin Sarah</option>
                      <option value="admin3">Admin Mike</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p className="text-sm text-gray-900">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>

              {/* Attachments */}
              {selectedTicket.attachments.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
                  <div className="space-y-3">
                    {selectedTicket.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <PaperClipIcon className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedTicket.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedTicket.updatedAt)}</p>
                    </div>
                  </div>
                  {selectedTicket.resolvedAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Resolved</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedTicket.resolvedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Satisfaction */}
              {selectedTicket.satisfaction && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Satisfaction</h3>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl font-bold text-yellow-500">{selectedTicket.satisfaction.rating}/5</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 ${
                            i < selectedTicket.satisfaction!.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedTicket.satisfaction.feedback && (
                    <p className="text-sm text-gray-600 italic">"{selectedTicket.satisfaction.feedback}"</p>
                  )}
                </div>
              )}
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
              <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
              <p className="text-gray-600">Manage customer support requests and inquiries</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{ticketStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-lg font-bold text-gray-900">{ticketStats.open}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-lg font-bold text-gray-900">{ticketStats.inProgress}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-lg font-bold text-gray-900">{ticketStats.resolved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-lg font-bold text-gray-900">{ticketStats.avgResponseTime}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 text-2xl">⭐</div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-lg font-bold text-gray-900">{ticketStats.satisfaction}/5</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
                  placeholder="Search tickets..."
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="account">Account</option>
                <option value="verification">Verification</option>
                <option value="general">General</option>
                <option value="bug_report">Bug Report</option>
                <option value="feature_request">Feature Request</option>
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
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
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
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{ticket.subject}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.customer.name}</div>
                        <div className="text-sm text-gray-500">{ticket.customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getCategoryLabel(ticket.category)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.assignedTo?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No support tickets found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}