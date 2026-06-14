'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  FlagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

interface FraudReport {
  id: string
  reportType: 'fake_profile' | 'fake_reviews' | 'payment_fraud' | 'identity_theft' | 'spam' | 'harassment'
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  reporter: {
    id: string
    name: string
    type: 'restaurant' | 'employee' | 'vendor'
    email: string
  }
  reported: {
    id: string
    name: string
    type: 'restaurant' | 'employee' | 'vendor'
    email: string
  }
  description: string
  evidence: string[]
  submittedAt: string
  assignedTo?: string
  resolvedAt?: string
  resolution?: string
}

const mockFraudReports: FraudReport[] = [
  {
    id: 'FR-001',
    reportType: 'fake_profile',
    status: 'pending',
    priority: 'high',
    reporter: {
      id: '1',
      name: 'Authentic Restaurant',
      type: 'restaurant',
      email: 'contact@authentic.com'
    },
    reported: {
      id: '2',
      name: 'Fake Bistro',
      type: 'restaurant',
      email: 'fake@bistro.com'
    },
    description: 'This restaurant is using stolen photos and fake reviews. They copied our menu and photos exactly.',
    evidence: ['screenshot1.jpg', 'comparison.pdf', 'fake_reviews.png'],
    submittedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'FR-002',
    reportType: 'payment_fraud',
    status: 'investigating',
    priority: 'critical',
    reporter: {
      id: '3',
      name: 'Fresh Supplies Co',
      type: 'vendor',
      email: 'billing@freshsupplies.com'
    },
    reported: {
      id: '4',
      name: 'Shady Restaurant',
      type: 'restaurant',
      email: 'orders@shady.com'
    },
    description: 'Customer placed large orders and used stolen credit card information. Multiple chargebacks received.',
    evidence: ['chargeback_notice.pdf', 'order_history.xlsx', 'payment_details.png'],
    submittedAt: '2024-01-14T15:45:00Z',
    assignedTo: 'Admin Sarah'
  },
  {
    id: 'FR-003',
    reportType: 'fake_reviews',
    status: 'resolved',
    priority: 'medium',
    reporter: {
      id: '5',
      name: 'John Chef',
      type: 'employee',
      email: 'john@email.com'
    },
    reported: {
      id: '6',
      name: 'Bad Boss Restaurant',
      type: 'restaurant',
      email: 'hr@badboss.com'
    },
    description: 'Restaurant is posting fake positive reviews and deleting negative feedback from employees.',
    evidence: ['fake_reviews_analysis.pdf', 'deleted_reviews.png'],
    submittedAt: '2024-01-10T09:20:00Z',
    resolvedAt: '2024-01-12T14:30:00Z',
    resolution: 'Removed fake reviews and warned restaurant owner.'
  }
]

export default function FraudReportsManagement() {
  const [reports, setReports] = useState(mockFraudReports)
  const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'dismissed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'fake_profile': return 'Fake Profile'
      case 'fake_reviews': return 'Fake Reviews'
      case 'payment_fraud': return 'Payment Fraud'
      case 'identity_theft': return 'Identity Theft'
      case 'spam': return 'Spam'
      case 'harassment': return 'Harassment'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter
    const matchesType = typeFilter === 'all' || report.reportType === typeFilter
    const matchesSearch = !searchQuery || 
      report.reporter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reported.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesPriority && matchesType && matchesSearch
  })

  const handleUpdateStatus = (reportId: string, newStatus: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: newStatus as FraudReport['status'] }
        : report
    ))
  }

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back to Reports</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Fraud Report Details</h1>
                  <p className="text-gray-600">Case #{selectedReport.id}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedReport.priority)}`}>
                  {selectedReport.priority.toUpperCase()} Priority
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Report Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Report Type</label>
                    <p className="text-gray-900">{getReportTypeLabel(selectedReport.reportType)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-900 mt-1">{selectedReport.description}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Evidence Files</label>
                    <div className="mt-2 space-y-2">
                      {selectedReport.evidence.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{file}</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Investigation Notes */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Investigation Notes</h2>
                <textarea
                  className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add investigation notes..."
                />
                <div className="mt-4 flex justify-end">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Add Note
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => handleUpdateStatus(selectedReport.id, 'investigating')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Start Investigation
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Mark Resolved
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Dismiss
                  </button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                    Take Action
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Reporter Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporter</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedReport.reporter.name}</p>
                      <p className="text-sm text-gray-600">{selectedReport.reporter.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedReport.reporter.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                    selectedReport.reporter.type === 'employee' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedReport.reporter.type.charAt(0).toUpperCase() + selectedReport.reporter.type.slice(1)}
                  </span>
                </div>
              </div>

              {/* Reported User Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reported User</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <UserCircleIcon className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedReport.reported.name}</p>
                      <p className="text-sm text-gray-600">{selectedReport.reported.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    selectedReport.reported.type === 'restaurant' ? 'bg-blue-100 text-blue-800' :
                    selectedReport.reported.type === 'employee' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedReport.reported.type.charAt(0).toUpperCase() + selectedReport.reported.type.slice(1)}
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submitted</p>
                      <p className="text-xs text-gray-600">{formatDate(selectedReport.submittedAt)}</p>
                    </div>
                  </div>
                  {selectedReport.assignedTo && (
                    <div className="flex items-center space-x-3">
                      <UserCircleIcon className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Assigned to {selectedReport.assignedTo}</p>
                      </div>
                    </div>
                  )}
                  {selectedReport.resolvedAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Resolved</p>
                        <p className="text-xs text-gray-600">{formatDate(selectedReport.resolvedAt)}</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Fraud Reports Management</h1>
              <p className="text-gray-600">Monitor and investigate fraud reports</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg">
                <span className="font-medium">{reports.filter(r => r.status === 'pending').length}</span> Pending
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                <span className="font-medium">{reports.filter(r => r.status === 'investigating').length}</span> Investigating
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
                  placeholder="Search reports..."
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
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
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
                <option value="critical">Critical</option>
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
                <option value="fake_profile">Fake Profile</option>
                <option value="fake_reviews">Fake Reviews</option>
                <option value="payment_fraud">Payment Fraud</option>
                <option value="identity_theft">Identity Theft</option>
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
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
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FlagIcon className="w-4 h-4 text-red-500 mr-2" />
                        <span className="font-medium text-gray-900">{report.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getReportTypeLabel(report.reportType)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.reporter.name}</div>
                        <div className="text-xs text-gray-500">{report.reporter.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.reported.name}</div>
                        <div className="text-xs text-gray-500">{report.reported.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(report.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        <CheckCircleIcon className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <ShieldExclamationIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No fraud reports found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}