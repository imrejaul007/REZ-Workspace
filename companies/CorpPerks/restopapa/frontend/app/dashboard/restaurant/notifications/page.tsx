'use client';

import { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'review' | 'inventory' | 'system' | 'promotion' | 'staff';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  timestamp: string;
  actionRequired: boolean;
  actionUrl?: string;
  metadata?: any;
}

export default function RestaurantNotifications() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif_001',
      title: 'New Order Received',
      message: 'Order #ORD-2025-0001 for ₹1,370 has been placed by Rajesh Kumar. Customer requested extra spicy food.',
      type: 'order',
      priority: 'high',
      isRead: false,
      timestamp: '2025-01-15 19:30:00',
      actionRequired: true,
      actionUrl: '/dashboard/restaurant/orders/ORD-2025-0001',
      metadata: {
        orderNumber: 'ORD-2025-0001',
        customerName: 'Rajesh Kumar',
        amount: 1370,
        orderType: 'delivery'
      }
    },
    {
      id: 'notif_002',
      title: 'Payment Received',
      message: 'Payment of ₹620 for Order #ORD-2025-0002 has been successfully processed via UPI.',
      type: 'payment',
      priority: 'medium',
      isRead: false,
      timestamp: '2025-01-15 19:25:00',
      actionRequired: false,
      metadata: {
        orderNumber: 'ORD-2025-0002',
        amount: 620,
        paymentMethod: 'UPI'
      }
    },
    {
      id: 'notif_003',
      title: 'New Customer Review',
      message: 'Priya Sharma left a 5-star review: "Outstanding food and service! The butter chicken was incredible."',
      type: 'review',
      priority: 'medium',
      isRead: true,
      timestamp: '2025-01-15 18:45:00',
      actionRequired: true,
      actionUrl: '/dashboard/restaurant/reviews',
      metadata: {
        customerName: 'Priya Sharma',
        rating: 5,
        reviewId: 'review_001'
      }
    },
    {
      id: 'notif_004',
      title: 'Low Stock Alert',
      message: 'Paneer is out of stock. Current inventory: 0 kg. Minimum threshold: 5 kg.',
      type: 'inventory',
      priority: 'urgent',
      isRead: false,
      timestamp: '2025-01-15 18:30:00',
      actionRequired: true,
      actionUrl: '/dashboard/restaurant/inventory',
      metadata: {
        itemName: 'Paneer',
        currentStock: 0,
        threshold: 5,
        unit: 'kg'
      }
    },
    {
      id: 'notif_005',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur on Jan 20, 2025 from 2:00 AM to 4:00 AM. No action required.',
      type: 'system',
      priority: 'low',
      isRead: true,
      timestamp: '2025-01-15 16:00:00',
      actionRequired: false,
      metadata: {
        maintenanceDate: '2025-01-20',
        startTime: '02:00',
        endTime: '04:00'
      }
    },
    {
      id: 'notif_006',
      title: 'Weekly Payout Processed',
      message: 'Your weekly payout of ₹41,040 has been processed and will reach your account within 2 business days.',
      type: 'payment',
      priority: 'medium',
      isRead: true,
      timestamp: '2025-01-15 15:30:00',
      actionRequired: false,
      metadata: {
        amount: 41040,
        payoutPeriod: 'Jan 8-14, 2025',
        expectedDate: '2025-01-17'
      }
    },
    {
      id: 'notif_007',
      title: 'Staff Schedule Update',
      message: 'Mike Johnson has requested a schedule change for tomorrow. Please review and approve the request.',
      type: 'staff',
      priority: 'medium',
      isRead: false,
      timestamp: '2025-01-15 14:20:00',
      actionRequired: true,
      actionUrl: '/dashboard/restaurant/staff',
      metadata: {
        staffName: 'Mike Johnson',
        requestType: 'schedule_change',
        date: '2025-01-16'
      }
    },
    {
      id: 'notif_008',
      title: 'Promotion Opportunity',
      message: 'Boost your sales with our Weekend Special promotion. Get 20% more visibility for featured items.',
      type: 'promotion',
      priority: 'low',
      isRead: true,
      timestamp: '2025-01-15 12:00:00',
      actionRequired: false,
      metadata: {
        promotionType: 'Weekend Special',
        discount: 20,
        validUntil: '2025-01-19'
      }
    },
    {
      id: 'notif_009',
      title: 'Customer Complaint',
      message: 'Vikash Agarwal filed a complaint about Order #ORD-2025-0005. Issue: "Found hair in curry". Requires immediate attention.',
      type: 'review',
      priority: 'urgent',
      isRead: false,
      timestamp: '2025-01-15 11:30:00',
      actionRequired: true,
      actionUrl: '/dashboard/restaurant/reviews',
      metadata: {
        customerName: 'Vikash Agarwal',
        orderNumber: 'ORD-2025-0005',
        complaintType: 'food_quality',
        severity: 'high'
      }
    },
    {
      id: 'notif_010',
      title: 'Low Stock Warning',
      message: 'Chicken Breast is running low. Current stock: 5 kg. Minimum threshold: 8 kg.',
      type: 'inventory',
      priority: 'high',
      isRead: true,
      timestamp: '2025-01-15 10:15:00',
      actionRequired: true,
      actionUrl: '/dashboard/restaurant/inventory',
      metadata: {
        itemName: 'Chicken Breast',
        currentStock: 5,
        threshold: 8,
        unit: 'kg'
      }
    }
  ]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'inventory': return 'bg-red-100 text-red-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'promotion': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return '📦';
      case 'payment': return '💰';
      case 'review': return '⭐';
      case 'inventory': return '📊';
      case 'system': return '⚙️';
      case 'promotion': return '🎯';
      case 'staff': return '👥';
      default: return '🔔';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = selectedFilter === 'all' || notification.type === selectedFilter;
    const matchesPriority = selectedPriority === 'all' || notification.priority === selectedPriority;
    const matchesReadStatus = !showUnreadOnly || !notification.isRead;
    
    return matchesType && matchesPriority && matchesReadStatus;
  });

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notif => notif.id !== notificationId));
    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-2 text-gray-600">Stay updated with your restaurant activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">📬</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-lg font-semibold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">📨</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-lg font-semibold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-red-600 text-xl">🚨</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-lg font-semibold text-gray-900">{urgentCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Action Required</p>
                <p className="text-lg font-semibold text-gray-900">
                  {notifications.filter(n => n.actionRequired && !n.isRead).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select 
              value={selectedFilter} 
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="order">Orders</option>
              <option value="payment">Payments</option>
              <option value="review">Reviews</option>
              <option value="inventory">Inventory</option>
              <option value="staff">Staff</option>
              <option value="system">System</option>
              <option value="promotion">Promotions</option>
            </select>
            
            <select 
              value={selectedPriority} 
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <label className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Unread only</span>
            </label>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Mark All Read
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500">Showing {filteredNotifications.length} of {notifications.length} notifications</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                    <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        {notification.actionRequired && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Action Required
                          </span>
                        )}
                        {!notification.isRead && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-2 ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(notification.timestamp).toLocaleString('en-IN')}</span>
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="px-6 py-12 text-center">
              <span className="text-6xl text-gray-300">🔔</span>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications</h3>
              <p className="mt-2 text-sm text-gray-500">
                {showUnreadOnly ? 'All notifications have been read.' : 'You\'re all caught up!'}
              </p>
            </div>
          )}

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing 1-{filteredNotifications.length} of {notifications.length} notifications
              </div>
              <div className="flex space-x-1">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Previous</button>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-white">Next</button>
              </div>
            </div>
          </div>
        </div>

        {selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTypeIcon(selectedNotification.type)}</span>
                  <h3 className="text-lg font-medium text-gray-900">{selectedNotification.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedNotification.type)}`}>
                    {selectedNotification.type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(selectedNotification.priority)}`}></div>
                    <span className="text-sm text-gray-600 capitalize">{selectedNotification.priority} priority</span>
                  </div>
                  {selectedNotification.actionRequired && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                      Action Required
                    </span>
                  )}
                  {!selectedNotification.isRead && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Unread
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                  <p className="text-gray-900">{selectedNotification.message}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Timestamp</h4>
                  <p className="text-gray-900">{new Date(selectedNotification.timestamp).toLocaleString('en-IN')}</p>
                </div>

                {selectedNotification.metadata && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          <span className="text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                <div className="flex space-x-2">
                  {selectedNotification.actionRequired && selectedNotification.actionUrl && (
                    <button
                      onClick={() => {
                        // In a real app, this would navigate to the action URL
                        logger.info('Navigate to:', selectedNotification.actionUrl);
                        setSelectedNotification(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Take Action
                    </button>
                  )}
                  {!selectedNotification.isRead && (
                    <button
                      onClick={() => {
                        markAsRead(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}