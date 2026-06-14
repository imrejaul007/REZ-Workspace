'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { OrderStatusUpdater } from '@/components/orders/order-status-updater';
import { NotificationIndicator } from '@/components/notifications/notification-indicator';
import { formatDate, formatCurrency, cn } from '@/lib/utils';
import { ordersApi, Order, OrderStats } from '@/lib/api/orders';
import { UserRole } from '@/types/auth';
import { toast } from 'react-hot-toast';

// Using the Order interface from the API

// Priority mapping helper (since API doesn't have priority field, we'll derive it from status/timing)
const getPriorityFromOrder = (order: Order): 'low' | 'medium' | 'high' | 'urgent' => {
  // Logic to determine priority based on status, timing, etc.
  if (order.status === 'PENDING' && order.paymentStatus === 'PENDING') return 'urgent';
  if (order.status === 'DISPATCHED') return 'high';
  if (['CONFIRMED', 'PREPARING', 'READY'].includes(order.status)) return 'medium';
  return 'low';
};

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [currentPage, statusFilter, dateFilter, sortBy, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = {
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter.toUpperCase() }),
        ...(searchTerm && { search: searchTerm }),
        sortBy: sortBy === 'newest' ? 'createdAt' : 
               sortBy === 'oldest' ? 'createdAt' : 
               sortBy === 'amount-high' ? 'total' : 
               sortBy === 'amount-low' ? 'total' : 'createdAt',
        sortOrder: (sortBy === 'oldest' || sortBy === 'amount-low' ? 'ASC' : 'DESC') as 'ASC' | 'DESC',
        ...(dateFilter !== 'all' && getDateRange(dateFilter)),
      };

      const response = await ordersApi.getOrders(queryParams);
      setOrders(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const stats = await ordersApi.getOrderStats();
      setOrderStats(stats);
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    }
  };

  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { startDate: today.toISOString() };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { startDate: weekAgo.toISOString() };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { startDate: monthAgo.toISOString() };
      default:
        return {};
    }
  };

  // Since filtering and sorting is handled server-side, we use the orders directly
  const sortedOrders = orders;

  // Use API stats or fallback to client-side calculation
  const statusStats = orderStats ? {
    total: orderStats.totalOrders,
    pending: orderStats.pendingOrders,
    processing: orderStats.processingOrders,
    dispatched: orderStats.dispatchedOrders,
    delivered: orderStats.deliveredOrders,
    cancelled: orderStats.cancelledOrders
  } : {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length,
    dispatched: orders.filter(o => o.status === 'DISPATCHED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PREPARING': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'READY': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'DISPATCHED': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'PENDING': return Clock;
      case 'CONFIRMED': case 'PREPARING': case 'READY': return Package;
      case 'DISPATCHED': return Truck;
      case 'DELIVERED': return CheckCircle;
      case 'CANCELLED': return AlertCircle;
      default: return Package;
    }
  };

  const handleOrderView = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    // Refresh stats after status update
    fetchOrderStats();
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track all your orders
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationIndicator />
            {user?.role === UserRole.RESTAURANT && (
              <Button size="default" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.processing}</p>
                  <p className="text-xs text-muted-foreground">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.dispatched}</p>
                  <p className="text-xs text-muted-foreground">Dispatched</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.delivered}</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{statusStats.cancelled}</p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search orders, customers, or vendors..."
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
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="DISPATCHED">Dispatched</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Highest Amount</option>
                  <option value="amount-low">Lowest Amount</option>
                  <option value="priority">By Priority</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {sortedOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 rounded-lg bg-muted">
                          <StatusIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-foreground">
                              Order #{order.orderNumber}
                            </h3>
                            <Badge className={cn('text-xs', getStatusColor(order.status))}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                            </Badge>
                            <Badge className={cn('text-xs', getPriorityColor(getPriorityFromOrder(order)))}>
                              {getPriorityFromOrder(order).toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Customer</p>
                              <p className="font-medium">
                                {order.customer.firstName} {order.customer.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customer.email}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-muted-foreground mb-1">Business</p>
                              <p className="font-medium">
                                {order.restaurant ? order.restaurant.businessName : 
                                 order.vendor ? order.vendor.businessName : 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.restaurant ? `${order.restaurant.city}, ${order.restaurant.state}` :
                                 order.vendor ? `${order.vendor.city}, ${order.vendor.state}` : ''}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-muted-foreground mb-1">Items & Amount</p>
                              <p className="font-medium">
                                {order.items.length} items • {formatCurrency(order.total)}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                Payment: {order.paymentStatus.toLowerCase()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-muted-foreground mb-1">Order Type</p>
                              <p className="font-medium capitalize">{order.type.replace('_', ' ').toLowerCase()}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.expectedDelivery ? 
                                  `Expected: ${formatDate(order.expectedDelivery, { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}` : 'No delivery date'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>Created: {formatDate(order.createdAt)}</span>
                            <span>Updated: {formatDate(order.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          
                          onClick={() => handleOrderView(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        {(user?.role === 'ADMIN' || user?.role === 'RESTAURANT' || user?.role === 'VENDOR') && (
                          <Button
                            variant="outline"
                            
                            onClick={() => toggleOrderExpansion(order.id)}
                          >
                            <Package className="h-4 w-4 mr-2" />
                            {expandedOrders.has(order.id) ? 'Hide Status' : 'Update Status'}
                          </Button>
                        )}
                        
                        <Button variant="ghost"  size="default">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Order Status Updater */}
                {expandedOrders.has(order.id) && (
                  <div className="mt-4">
                    <OrderStatusUpdater
                      orderId={order.id}
                      currentStatus={order.status}
                      userRole={(user?.role || 'CUSTOMER')}
                      onStatusUpdate={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your orders will appear here once you start placing them'
              }
            </p>
            {user?.role === UserRole.RESTAURANT && (
              <Button size="default" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Create First Order
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}