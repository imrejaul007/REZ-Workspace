'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  AlertTriangle,
  MessageSquare,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ordersApi } from '@/lib/api/orders';
import { toast } from 'react-hot-toast';

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

interface StatusUpdateData {
  status: OrderStatus;
  notes?: string;
}

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
  userRole: 'ADMIN' | 'RESTAURANT' | 'VENDOR' | 'CUSTOMER';
  onStatusUpdate: (newStatus: OrderStatus) => void;
  className?: string;
}

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

const statusConfig = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    description: 'Order is awaiting confirmation'
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: CheckCircle,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    description: 'Order has been confirmed and accepted'
  },
  PREPARING: {
    label: 'Preparing',
    icon: Package,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    description: 'Order is being prepared'
  },
  READY: {
    label: 'Ready',
    icon: Package,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    description: 'Order is ready for pickup/dispatch'
  },
  DISPATCHED: {
    label: 'Dispatched',
    icon: Truck,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    description: 'Order is on the way'
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    description: 'Order has been delivered successfully'
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    description: 'Order has been cancelled'
  }
};

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  userRole,
  onStatusUpdate,
  className
}: OrderStatusUpdaterProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const availableStatuses = statusTransitions[currentStatus] || [];
  const canUpdateStatus = userRole !== 'CUSTOMER' || (userRole === 'CUSTOMER' && availableStatuses.includes('CANCELLED'));

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    setIsUpdating(true);
    try {
      await ordersApi.updateOrder(orderId, {
        status: selectedStatus,
        ...(notes && { customerNotes: notes })
      });

      onStatusUpdate(selectedStatus);
      toast.success(`Order status updated to ${statusConfig[selectedStatus].label}`);
      setShowForm(false);
      setSelectedStatus(null);
      setNotes('');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsUpdating(true);
    try {
      await ordersApi.cancelOrder(orderId, notes);
      onStatusUpdate('CANCELLED');
      toast.success('Order cancelled successfully');
      setShowForm(false);
      setNotes('');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel order');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!canUpdateStatus || availableStatuses.length === 0) {
    return null;
  }

  const currentConfig = statusConfig[currentStatus];
  const CurrentIcon = currentConfig.icon;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CurrentIcon className="h-5 w-5" />
          <span>Update Order Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status Display */}
        <div className="flex items-center space-x-3">
          <span className="text-sm text-muted-foreground">Current Status:</span>
          <Badge className={cn('text-xs', currentConfig.color)}>
            {currentConfig.label}
          </Badge>
        </div>

        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full"
          >
            <Package className="h-4 w-4 mr-2" />
            Update Status
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Select New Status:
              </label>
              <div className="grid gap-2">
                {availableStatuses.map((status) => {
                  const config = statusConfig[status];
                  const Icon = config.icon;

                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={cn(
                        'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                        selectedStatus === status
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{config.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {config.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Notes {selectedStatus === 'CANCELLED' && <span className="text-red-500">*</span>}:
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    selectedStatus === 'CANCELLED'
                      ? 'Please provide a reason for cancellation'
                      : 'Optional notes about this status update'
                  }
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {selectedStatus === 'CANCELLED' ? (
                <Button
                  onClick={handleCancel}
                  disabled={isUpdating || !notes.trim()}
                  variant="destructive"
                  className="flex-1"
                  size="default">
                  {isUpdating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2"
                    >
                      <Package className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  )}
                  Cancel Order
                </Button>
              ) : (
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating || !selectedStatus}
                  className="flex-1"
                  size="default" variant="default">
                  {isUpdating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-4 w-4 mr-2"
                    >
                      <Package className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Status
                </Button>
              )}
              
              <Button
                onClick={() => {
                  setShowForm(false);
                  setSelectedStatus(null);
                  setNotes('');
                }}
                variant="outline"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default OrderStatusUpdater;