'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  User,
  CreditCard,
  Calendar,
  MessageSquare,
  Star,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  unit: string;
  price: number;
  totalPrice: number;
  specifications?: string;
}

interface DeliveryInfo {
  method: 'pickup' | 'delivery' | 'shipping';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    landmark?: string;
  };
  estimatedDelivery: string;
  actualDelivery?: string;
  trackingNumber?: string;
  courier?: {
    name: string;
    phone: string;
    vehicleNumber?: string;
  };
  deliveryInstructions?: string;
}

interface PaymentInfo {
  method: 'card' | 'upi' | 'cash' | 'bank_transfer' | 'credit';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: 'restaurant' | 'individual';
    companyName?: string;
  };
  vendor: {
    id: string;
    name: string;
    phone: string;
    email: string;
    location: string;
    rating: number;
  };
  items: OrderItem[];
  pricing: {
    subtotal: number;
    tax: number;
    shippingCost: number;
    discount: number;
    total: number;
  };
  delivery: DeliveryInfo;
  payment: PaymentInfo;
  timeline: {
    status: string;
    timestamp: string;
    description: string;
    location?: string;
    updatedBy?: string;
  }[];
  notes?: string;
  customerNotes?: string;
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  expectedDelivery: string;
}

interface OrderTrackingProps {
  order: Order;
  currentUserRole: 'customer' | 'vendor' | 'admin' | 'courier';
  onUpdateStatus?: (orderId: string, status: Order['status'], notes?: string) => void;
  onCancelOrder?: (orderId: string, reason: string) => void;
  onContactVendor?: (vendorId: string) => void;
  onContactCustomer?: (customerId: string) => void;
  onRateOrder?: (orderId: string, rating: number, review: string) => void;
  onReorder?: (orderId: string) => void;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Clock },
  { key: 'ready', label: 'Ready', icon: Package },
  { key: 'dispatched', label: 'Dispatched', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle }
];

export default function OrderTracking({
  order,
  currentUserRole,
  onUpdateStatus,
  onCancelOrder,
  onContactVendor,
  onContactCustomer,
  onRateOrder,
  onReorder
}: OrderTrackingProps) {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>(order.status);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'ready': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'dispatched': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === order.status);
  };

  const canUpdateStatus = () => {
    return currentUserRole === 'vendor' || currentUserRole === 'admin';
  };

  const canCancelOrder = () => {
    return (currentUserRole === 'customer' || currentUserRole === 'admin') && 
           !['delivered', 'cancelled'].includes(order.status);
  };

  const canRateOrder = () => {
    return currentUserRole === 'customer' && order.status === 'delivered' && !order.rating;
  };

  const handleStatusUpdate = () => {
    onUpdateStatus?.(order.id, selectedStatus, updateNotes);
    setShowUpdateModal(false);
    setUpdateNotes('');
  };

  const handleRatingSubmit = () => {
    onRateOrder?.(order.id, rating, review);
    setShowRatingModal(false);
    setRating(0);
    setReview('');
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
                <Badge className={cn('text-xs', getStatusColor(order.status))}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
                <Badge className={cn('text-xs', getPriorityColor(order.priority))}>
                  {order.priority.toUpperCase()}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Placed on {formatDate(order.createdAt)} • Expected delivery: {formatDate(order.expectedDelivery)}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" >
                <Download className="h-4 w-4 mr-2" />
                Invoice
              </Button>
              
              <Button variant="ghost" >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Order Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= getCurrentStepIndex();
                const isCurrent = index === getCurrentStepIndex();
                
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                        isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                        isCurrent ? 'border-primary text-primary bg-primary/10' :
                        'border-muted-foreground text-muted-foreground'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className={cn(
                        'text-sm font-medium mt-2 text-center',
                        isCompleted ? 'text-foreground' :
                        isCurrent ? 'text-primary' :
                        'text-muted-foreground'
                      )}>
                        {step.label}
                      </p>
                    </div>
                    
                    {index < statusSteps.length - 1 && (
                      <div className={cn(
                        'flex-1 h-0.5 mx-4',
                        isCompleted ? 'bg-primary' : 'bg-border'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timeline Details */}
            <div className="space-y-4">
              <h4 className="font-medium">Order Timeline</h4>
              <div className="space-y-3">
                {order.timeline.map((event, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-3 border-b border-border last:border-b-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{event.status}</p>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(event.timestamp, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      {event.location && (
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} {item.unit} • {formatCurrency(item.price)} per {item.unit}
                    </p>
                    {item.specifications && (
                      <p className="text-xs text-muted-foreground mt-1">{item.specifications}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(item.totalPrice)}</p>
                  </div>
                </div>
              ))}
              
              {/* Pricing Summary */}
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.pricing.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.pricing.tax)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.pricing.shippingCost)}</span>
                </div>
                {order.pricing.discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.pricing.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-semibold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(order.pricing.total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery & Contact Info */}
        <div className="space-y-6">
          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">{order.delivery.method}</span>
                </div>
                
                {order.delivery.address && (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm">{order.delivery.address.street}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.delivery.address.city}, {order.delivery.address.state} {order.delivery.address.zipCode}
                        </p>
                        {order.delivery.address.landmark && (
                          <p className="text-xs text-muted-foreground">
                            Landmark: {order.delivery.address.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {order.delivery.trackingNumber && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Tracking: {order.delivery.trackingNumber}</span>
                  </div>
                )}

                {order.delivery.courier && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Courier Details</h5>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Name: {order.delivery.courier.name}</p>
                      <p>Phone: {order.delivery.courier.phone}</p>
                      {order.delivery.courier.vehicleNumber && (
                        <p>Vehicle: {order.delivery.courier.vehicleNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                {order.delivery.deliveryInstructions && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">Delivery Instructions</h5>
                    <p className="text-sm text-muted-foreground">
                      {order.delivery.deliveryInstructions}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Customer Info */}
                <div>
                  <h5 className="font-medium text-sm mb-2">Customer</h5>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{order.customer.name}</p>
                    {order.customer.companyName && (
                      <p className="text-muted-foreground">{order.customer.companyName}</p>
                    )}
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{order.customer.phone}</span>
                    </div>
                  </div>
                  
                  {currentUserRole === 'vendor' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => onContactCustomer?.(order.customer.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Customer
                    </Button>
                  )}
                </div>

                {/* Vendor Info */}
                <div>
                  <h5 className="font-medium text-sm mb-2">Vendor</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{order.vendor.name}</p>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{order.vendor.rating}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{order.vendor.location}</p>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{order.vendor.phone}</span>
                    </div>
                  </div>
                  
                  {currentUserRole === 'customer' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => onContactVendor?.(order.vendor.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Vendor
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium mb-2">Payment Details</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="capitalize">{order.payment.method}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={cn(
                    'text-xs',
                    order.payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  )}>
                    {order.payment.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatCurrency(order.payment.amount)}</span>
                </div>
                {order.payment.transactionId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-xs">{order.payment.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
            
            {order.payment.paidAt && (
              <div>
                <h5 className="font-medium mb-2">Payment Timeline</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid on</span>
                    <span>{formatDate(order.payment.paidAt)}</span>
                  </div>
                  {order.payment.refundedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Refunded on</span>
                      <span>{formatDate(order.payment.refundedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {canUpdateStatus() && (
                <Button 
                  variant="outline"
                  onClick={() => setShowUpdateModal(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Status
                </Button>
              )}
              
              {canCancelOrder() && (
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {order.status === 'delivered' && currentUserRole === 'customer' && (
                <Button variant="outline" onClick={() => onReorder?.(order.id)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reorder
                </Button>
              )}
              
              {canRateOrder() && (
                <Button onClick={() => setShowRatingModal(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  Rate Order
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowRatingModal(false)}
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">How would you rate this order?</p>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="p-1"
                        >
                          <Star className={cn(
                            'h-6 w-6',
                            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          )} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Review (Optional)</label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your experience with this order..."
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRatingModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRatingSubmit}
                      disabled={rating === 0}
                    >
                      Submit Rating
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Update Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowUpdateModal(false)}
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">New Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => e.target.value}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    >
                      {statusSteps.map((step) => (
                        <option key={step.key} value={step.key}>
                          {step.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                    <textarea
                      value={updateNotes}
                      onChange={(e) => setUpdateNotes(e.target.value)}
                      placeholder="Add unknown additional information..."
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowUpdateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleStatusUpdate}>
                      Update Status
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