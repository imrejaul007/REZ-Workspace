'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  BellIcon,
  CheckIcon,
  TrashIcon,
  BriefcaseIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

// Mock notifications data
const notificationsData = [
  {
    id: 1,
    type: 'job_application',
    title: 'Job Application Update',
    message: 'Your application for Head Chef at Ocean View Diner has been reviewed.',
    timestamp: '2 minutes ago',
    read: false,
    icon: BriefcaseIcon,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    action: 'View Application'
  },
  {
    id: 2,
    type: 'message',
    title: 'New Message',
    message: 'Fresh Farm Supplies sent you a message about your order.',
    timestamp: '15 minutes ago',
    read: false,
    icon: ChatBubbleLeftIcon,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    action: 'View Message'
  },
  {
    id: 3,
    type: 'like',
    title: 'Post Liked',
    message: 'John Smith liked your community post about kitchen management tips.',
    timestamp: '1 hour ago',
    read: true,
    icon: HeartIcon,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    action: 'View Post'
  },
  {
    id: 4,
    type: 'order',
    title: 'Order Confirmed',
    message: 'Your order #12345 for Premium Organic Tomatoes has been confirmed.',
    timestamp: '2 hours ago',
    read: true,
    icon: ShoppingCartIcon,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-50',
    action: 'Track Order'
  },
  {
    id: 5,
    type: 'security',
    title: 'Security Alert',
    message: 'New login detected from Miami, FL. Was this you?',
    timestamp: '3 hours ago',
    read: false,
    icon: ExclamationTriangleIcon,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    action: 'Review Activity'
  },
  {
    id: 6,
    type: 'job_match',
    title: 'New Job Match',
    message: 'We found 3 new job opportunities that match your profile.',
    timestamp: '4 hours ago',
    read: true,
    icon: BriefcaseIcon,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    action: 'View Jobs'
  },
  {
    id: 7,
    type: 'community',
    title: 'Community Update',
    message: 'New discussion started in Restaurant Management group.',
    timestamp: '6 hours ago',
    read: true,
    icon: UserGroupIcon,
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    action: 'Join Discussion'
  },
  {
    id: 8,
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM EST.',
    timestamp: '1 day ago',
    read: true,
    icon: InformationCircleIcon,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    action: 'Learn More'
  },
  {
    id: 9,
    type: 'verification',
    title: 'Profile Verified',
    message: 'Congratulations! Your employee profile has been verified.',
    timestamp: '2 days ago',
    read: true,
    icon: CheckCircleIcon,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    action: 'View Profile'
  }
]

export default function Notifications() {
  const router = useRouter()
  const [notifications, setNotifications] = useState(notificationsData)
  const [filter, setFilter] = useState('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const handleDelete = (id: number) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    )
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([])
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  const filters = [
    { id: 'all', name: `All (${notifications.length})` },
    { id: 'unread', name: `Unread (${unreadCount})` },
    { id: 'read', name: `Read (${notifications.length - unreadCount})` }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>
              
              <div className="flex items-center gap-2">
                <BellIcon className="w-6 h-6 text-gray-700" />
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Mark all as read
                </button>
              )}
              
              <button
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear all
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            {filters.map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filterOption.name}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <BellIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications." 
                  : filter === 'read'
                  ? "No read notifications to show."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = notification.icon
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm p-4 transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${notification.bgColor}`}>
                      <Icon className={`w-5 h-5 ${notification.iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-gray-500">
                              {notification.timestamp}
                            </span>
                            
                            {notification.action && (
                              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                {notification.action}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="Mark as read"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete notification"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-4 left-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Load More Button */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-white text-gray-700 px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  )
}