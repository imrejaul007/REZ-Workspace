'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BellIcon,
  InboxIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BriefcaseIcon,
  UserCircleIcon,
  CalendarIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Notification {
  id: number
  type: 'job_alert' | 'application_update' | 'message' | 'system' | 'reminder' | 'training'
  title: string
  message: string
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  actionLabel?: string
  metadata?: {
    jobId?: number
    applicationId?: number
    senderId?: number
    courseId?: number
  }
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'application_update',
    title: 'Interview Scheduled',
    message: 'Your interview for Sous Chef position at Ocean Grill has been scheduled for March 25th at 2:00 PM.',
    timestamp: '2024-03-22T10:30:00Z',
    read: false,
    priority: 'high',
    actionUrl: '/dashboard/employee/applications',
    actionLabel: 'View Details',
    metadata: { applicationId: 1, jobId: 101 }
  },
  {
    id: 2,
    type: 'job_alert',
    title: 'New Job Match',
    message: 'A new Head Chef position at Bella Vista Restaurant matches your preferences. Salary: $70,000 - $80,000.',
    timestamp: '2024-03-22T08:15:00Z',
    read: false,
    priority: 'medium',
    actionUrl: '/jobs/105',
    actionLabel: 'View Job',
    metadata: { jobId: 105 }
  },
  {
    id: 3,
    type: 'training',
    title: 'Course Reminder',
    message: 'You have an upcoming deadline for "Advanced Culinary Techniques" course. Complete by March 30th to earn your certificate.',
    timestamp: '2024-03-21T16:20:00Z',
    read: false,
    priority: 'medium',
    actionUrl: '/dashboard/employee/skills',
    actionLabel: 'Continue Course',
    metadata: { courseId: 1 }
  },
  {
    id: 4,
    type: 'message',
    title: 'Message from Ocean Grill',
    message: 'Thank you for your application. We will review your profile and get back to you within 3-5 business days.',
    timestamp: '2024-03-20T14:45:00Z',
    read: true,
    priority: 'low',
    actionUrl: '/messages',
    actionLabel: 'View Message'
  },
  {
    id: 5,
    type: 'system',
    title: 'Profile Verification',
    message: 'Your Food Safety certification has been verified successfully. Your profile credibility has increased.',
    timestamp: '2024-03-20T11:30:00Z',
    read: true,
    priority: 'low',
    actionUrl: '/dashboard/employee/profile',
    actionLabel: 'View Profile'
  },
  {
    id: 6,
    type: 'application_update',
    title: 'Application Status Update',
    message: 'Your application for Line Cook position at Fresh Garden Bistro is now under review.',
    timestamp: '2024-03-19T09:15:00Z',
    read: true,
    priority: 'medium',
    actionUrl: '/dashboard/employee/applications',
    actionLabel: 'Check Status',
    metadata: { applicationId: 2, jobId: 102 }
  },
  {
    id: 7,
    type: 'reminder',
    title: 'Weekly Job Search',
    message: 'Don\'t forget to check for new job opportunities this week. 15 new positions have been posted in your area.',
    timestamp: '2024-03-18T07:00:00Z',
    read: true,
    priority: 'low',
    actionUrl: '/dashboard/employee/jobs',
    actionLabel: 'Browse Jobs'
  },
  {
    id: 8,
    type: 'job_alert',
    title: 'Saved Job Update',
    message: 'The Prep Cook position at Downtown Deli you bookmarked has updated its requirements.',
    timestamp: '2024-03-17T15:30:00Z',
    read: true,
    priority: 'low',
    actionUrl: '/jobs/103',
    actionLabel: 'View Changes',
    metadata: { jobId: 103 }
  }
]

export default function EmployeeNotifications() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([])

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.read) ||
                         (filter === 'read' && notification.read) ||
                         notification.type === filter

    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_alert': return <BriefcaseIcon className="w-5 h-5" />
      case 'application_update': return <InboxIcon className="w-5 h-5" />
      case 'message': return <UserCircleIcon className="w-5 h-5" />
      case 'system': return <InformationCircleIcon className="w-5 h-5" />
      case 'reminder': return <CalendarIcon className="w-5 h-5" />
      case 'training': return <CheckCircleIcon className="w-5 h-5" />
      default: return <BellIcon className="w-5 h-5" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'bg-red-100 text-red-600 border-red-200'
    if (priority === 'high') return 'bg-orange-100 text-orange-600 border-orange-200'
    
    switch (type) {
      case 'job_alert': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'application_update': return 'bg-green-100 text-green-600 border-green-200'
      case 'message': return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'system': return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'reminder': return 'bg-yellow-100 text-yellow-600 border-yellow-200'
      case 'training': return 'bg-indigo-100 text-indigo-600 border-indigo-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case 'urgent': return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      case 'high': return <div className="w-3 h-3 bg-orange-500 rounded-full" />
      case 'medium': return <div className="w-3 h-3 bg-yellow-500 rounded-full" />
      default: return <div className="w-3 h-3 bg-gray-400 rounded-full" />
    }
  }

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)))
    setSelectedNotifications([])
  }

  const toggleSelection = (notificationId: number) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const selectAll = () => {
    setSelectedNotifications(filteredNotifications.map(n => n.id))
  }

  const clearSelection = () => {
    setSelectedNotifications([])
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const getStats = () => {
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      high: notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length,
      today: notifications.filter(n => {
        const today = new Date().toDateString()
        return new Date(n.timestamp).toDateString() === today
      }).length
    }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">Stay updated with your job applications and opportunities</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BellIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{stats.high}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="job_alert">Job Alerts</option>
                <option value="application_update">Applications</option>
                <option value="message">Messages</option>
                <option value="training">Training</option>
                <option value="reminder">Reminders</option>
              </select>

              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                Mark All Read
              </button>
            </div>
          </div>

          {selectedNotifications.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-blue-800 font-medium">
                {selectedNotifications.length} notification(s) selected
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={deleteSelected}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Delete Selected
                </button>
                <button
                  onClick={clearSelection}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {filter === 'all' ? 'You\'re all caught up!' : 'Try adjusting your filters'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
                } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelection(notification.id)}
                        className="mt-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className={`p-2 rounded-lg border ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {getPriorityIndicator(notification.priority)}
                          {!notification.read && (
                            <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{notification.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          <div className="flex items-center space-x-3">
                            {notification.actionUrl && (
                              <button
                                onClick={() => router.push(notification.actionUrl!)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                              >
                                {notification.actionLabel || 'View'}
                              </button>
                            )}
                            
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="flex items-center text-gray-500 hover:text-gray-700 text-sm"
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                Mark as read
                              </button>
                            )}
                            
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bulk Actions */}
        {filteredNotifications.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={selectAll}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 mr-3"
            >
              Select All
            </button>
            <button
              onClick={() => router.push('/dashboard/employee/settings')}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <CogIcon className="w-4 h-4 mr-2" />
              Notification Settings
            </button>
          </div>
        )}
      </div>
    </div>
  )
}