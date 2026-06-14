/**
 * Order tracking and real-time status management system
 * Provides live tracking, status updates, and delivery progress for orders
 */

import React from 'react';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type DeliveryStatus = 
  | 'order_placed'
  | 'order_confirmed'
  | 'preparing_food'
  | 'food_ready'
  | 'rider_assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'arriving_soon'
  | 'delivered'
  | 'cancelled';

export interface TrackingLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

export interface DeliveryRider {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  rating: number;
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  currentLocation?: TrackingLocation;
  estimatedArrival?: string;
}

export interface OrderTimeline {
  status: DeliveryStatus;
  timestamp: string;
  message: string;
  description?: string;
  icon?: string;
  completed: boolean;
  current?: boolean;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  placedAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  
  restaurant: {
    id: string;
    name: string;
    address: string;
    phone: string;
    location: TrackingLocation;
  };
  
  customer: {
    name: string;
    address: string;
    phone: string;
    location: TrackingLocation;
  };
  
  rider?: DeliveryRider;
  
  timeline: OrderTimeline[];
  
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }[];
  
  payment: {
    method: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    amount: number;
  };
  
  tracking: {
    currentLocation?: TrackingLocation;
    route?: TrackingLocation[];
    distance?: number; // in km
    duration?: number; // in minutes
    progress?: number; // percentage
  };
  
  notifications: {
    id: string;
    type: 'status_update' | 'rider_update' | 'delay' | 'arrival';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }[];
  
  ratings?: {
    food: number;
    delivery: number;
    packaging: number;
    overall: number;
    comment?: string;
  };
}

export interface TrackingUpdate {
  orderId: string;
  type: 'status' | 'location' | 'rider' | 'eta' | 'notification';
  data;
  timestamp: string;
}

// Timeline configuration for different statuses
const TIMELINE_CONFIG: Record<DeliveryStatus, { message: string; description: string; icon: string }> = {
  order_placed: {
    message: 'Order Placed',
    description: 'Your order has been received',
    icon: 'ShoppingCart'
  },
  order_confirmed: {
    message: 'Order Confirmed',
    description: 'Restaurant has accepted your order',
    icon: 'CheckCircle'
  },
  preparing_food: {
    message: 'Preparing Your Food',
    description: 'Chef is preparing your delicious meal',
    icon: 'ChefHat'
  },
  food_ready: {
    message: 'Food Ready',
    description: 'Your order is ready for pickup',
    icon: 'Package'
  },
  rider_assigned: {
    message: 'Rider Assigned',
    description: 'A delivery partner has been assigned',
    icon: 'User'
  },
  picked_up: {
    message: 'Order Picked Up',
    description: 'Rider has picked up your order',
    icon: 'Bike'
  },
  on_the_way: {
    message: 'On The Way',
    description: 'Your order is on its way to you',
    icon: 'Truck'
  },
  arriving_soon: {
    message: 'Arriving Soon',
    description: 'Your order will arrive in a few minutes',
    icon: 'Clock'
  },
  delivered: {
    message: 'Delivered',
    description: 'Your order has been delivered',
    icon: 'CheckCircle2'
  },
  cancelled: {
    message: 'Order Cancelled',
    description: 'Your order has been cancelled',
    icon: 'XCircle'
  }
};

// Mock data generator for demo purposes
function generateMockTracking(orderId: string): OrderTracking {
  const now = new Date();
  const placedAt = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
  const estimatedDelivery = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
  
  const statuses: DeliveryStatus[] = [
    'order_placed',
    'order_confirmed',
    'preparing_food',
    'food_ready',
    'rider_assigned',
    'picked_up',
    'on_the_way'
  ];
  
  const currentStatusIndex = 6; // Currently "on_the_way"
  
  const timeline: OrderTimeline[] = statuses.map((status, index) => {
    const config = TIMELINE_CONFIG[status];
    const statusTime = new Date(placedAt.getTime() + (index * 5 * 60 * 1000)); // 5 minutes apart
    
    return {
      status,
      timestamp: statusTime.toISOString(),
      message: config.message,
      description: config.description,
      icon: config.icon,
      completed: index <= currentStatusIndex,
      current: index === currentStatusIndex
    };
  });
  
  return {
    orderId,
    orderNumber: `ORD-${orderId.slice(0, 8).toUpperCase()}`,
    status: 'confirmed',
    deliveryStatus: 'on_the_way',
    placedAt: placedAt.toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
    
    restaurant: {
      id: 'rest-001',
      name: 'The Golden Spoon',
      address: '123 Main St, Downtown',
      phone: '+91 98765 43210',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: '123 Main St, Downtown',
        timestamp: now.toISOString()
      }
    },
    
    customer: {
      name: 'John Doe',
      address: '456 Park Avenue, Apt 12B',
      phone: '+91 98765 12345',
      location: {
        latitude: 28.6239,
        longitude: 77.2190,
        address: '456 Park Avenue, Apt 12B',
        timestamp: now.toISOString()
      }
    },
    
    rider: {
      id: 'rider-001',
      name: 'Rajesh Kumar',
      phone: '+91 98765 67890',
      photo: '/avatars/rider-1.jpg',
      rating: 4.8,
      vehicleType: 'bike',
      vehicleNumber: 'DL 01 AB 1234',
      currentLocation: {
        latitude: 28.6189,
        longitude: 77.2140,
        timestamp: now.toISOString()
      },
      estimatedArrival: estimatedDelivery.toISOString()
    },
    
    timeline,
    
    items: [
      {
        id: 'item-1',
        name: 'Butter Chicken',
        quantity: 1,
        price: 350
      },
      {
        id: 'item-2',
        name: 'Garlic Naan',
        quantity: 2,
        price: 60
      },
      {
        id: 'item-3',
        name: 'Biryani',
        quantity: 1,
        price: 280
      }
    ],
    
    payment: {
      method: 'Online - Card',
      status: 'paid',
      amount: 750
    },
    
    tracking: {
      currentLocation: {
        latitude: 28.6189,
        longitude: 77.2140,
        timestamp: now.toISOString()
      },
      distance: 2.5,
      duration: 15,
      progress: 70
    },
    
    notifications: [
      {
        id: 'notif-1',
        type: 'status_update',
        title: 'Order Confirmed',
        message: 'Your order has been confirmed by the restaurant',
        timestamp: new Date(placedAt.getTime() + 2 * 60 * 1000).toISOString(),
        read: true
      },
      {
        id: 'notif-2',
        type: 'rider_update',
        title: 'Rider Assigned',
        message: 'Rajesh Kumar is on the way to pick up your order',
        timestamp: new Date(placedAt.getTime() + 20 * 60 * 1000).toISOString(),
        read: true
      },
      {
        id: 'notif-3',
        type: 'arrival',
        title: 'Order Picked Up',
        message: 'Your order is on its way!',
        timestamp: new Date(placedAt.getTime() + 25 * 60 * 1000).toISOString(),
        read: false
      }
    ]
  };
}

export class OrderTrackingManager {
  private orders: Map<string, OrderTracking> = new Map();
  private listeners: Map<string, ((update: TrackingUpdate) => void)[]> = new Map();
  private updateInterval?: NodeJS.Timeout;

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create some sample orders for testing
    const mockOrderIds = ['order-001', 'order-002', 'order-003'];
    mockOrderIds.forEach(id => {
      this.orders.set(id, generateMockTracking(id));
    });
  }

  /**
   * Get tracking information for an order
   */
  getTracking(orderId: string): OrderTracking | null {
    return this.orders.get(orderId) || null;
  }

  /**
   * Subscribe to tracking updates for an order
   */
  subscribe(orderId: string, callback: (update: TrackingUpdate) => void): () => void {
    if (!this.listeners.has(orderId)) {
      this.listeners.set(orderId, []);
    }
    
    this.listeners.get(orderId)!.push(callback);
    
    // Start simulation if not already running
    if (!this.updateInterval) {
      this.startSimulation();
    }
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(orderId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        
        // Clean up empty listener arrays
        if (callbacks.length === 0) {
          this.listeners.delete(orderId);
        }
      }
      
      // Stop simulation if no more listeners
      if (this.listeners.size === 0 && this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = undefined;
      }
    };
  }

  /**
   * Simulate real-time updates (for demo purposes)
   */
  private startSimulation() {
    this.updateInterval = setInterval(() => {
      this.orders.forEach((tracking, orderId) => {
        // Simulate location updates
        if (tracking.rider && tracking.tracking.currentLocation) {
          const newLat = tracking.tracking.currentLocation.latitude + (Math.random() - 0.5) * 0.001;
          const newLng = tracking.tracking.currentLocation.longitude + (Math.random() - 0.5) * 0.001;
          
          tracking.tracking.currentLocation = {
            latitude: newLat,
            longitude: newLng,
            timestamp: new Date().toISOString()
          };
          
          // Update progress
          if (tracking.tracking.progress && tracking.tracking.progress < 100) {
            tracking.tracking.progress = Math.min(100, tracking.tracking.progress + Math.random() * 5);
          }
          
          // Update ETA
          const eta = new Date();
          eta.setMinutes(eta.getMinutes() + Math.floor(15 - (tracking.tracking.progress || 0) / 10));
          tracking.estimatedDelivery = eta.toISOString();
          
          // Notify listeners
          this.notifyListeners(orderId, {
            orderId,
            type: 'location',
            data: tracking.tracking.currentLocation,
            timestamp: new Date().toISOString()
          });
        }
      });
    }, 5000); // Update every 5 seconds
  }

  /**
   * Notify listeners of updates
   */
  private notifyListeners(orderId: string, update: TrackingUpdate) {
    const callbacks = this.listeners.get(orderId);
    if (callbacks) {
      callbacks.forEach(callback => callback(update));
    }
  }

  /**
   * Update order status
   */
  updateStatus(orderId: string, status: DeliveryStatus) {
    const tracking = this.orders.get(orderId);
    if (tracking) {
      tracking.deliveryStatus = status;
      
      // Update timeline
      const timeline = tracking.timeline;
      const statusIndex = timeline.findIndex(t => t.status === status);
      
      if (statusIndex > -1) {
        // Mark all previous as completed
        timeline.forEach((t, i) => {
          t.completed = i <= statusIndex;
          t.current = i === statusIndex;
        });
      }
      
      // Add notification
      const config = TIMELINE_CONFIG[status];
      tracking.notifications.push({
        id: `notif-${Date.now()}`,
        type: 'status_update',
        title: config.message,
        message: config.description,
        timestamp: new Date().toISOString(),
        read: false
      });
      
      // Notify listeners
      this.notifyListeners(orderId, {
        orderId,
        type: 'status',
        data: { status, timeline },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update rider information
   */
  updateRider(orderId: string, rider: DeliveryRider) {
    const tracking = this.orders.get(orderId);
    if (tracking) {
      tracking.rider = rider;
      
      // Notify listeners
      this.notifyListeners(orderId, {
        orderId,
        type: 'rider',
        data: rider,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(orderId: string, notificationId: string) {
    const tracking = this.orders.get(orderId);
    if (tracking) {
      const notification = tracking.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  /**
   * Get order statistics
   */
  getOrderStats(orderId: string) {
    const tracking = this.orders.get(orderId);
    if (!tracking) return null;
    
    const placedTime = new Date(tracking.placedAt).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - placedTime) / 1000 / 60); // minutes
    
    const estimatedTime = new Date(tracking.estimatedDelivery).getTime();
    const remaining = Math.max(0, Math.floor((estimatedTime - now) / 1000 / 60)); // minutes
    
    return {
      elapsedTime: elapsed,
      remainingTime: remaining,
      totalTime: elapsed + remaining,
      progress: tracking.tracking.progress || 0,
      distance: tracking.tracking.distance || 0,
      completedSteps: tracking.timeline.filter(t => t.completed).length,
      totalSteps: tracking.timeline.length,
      unreadNotifications: tracking.notifications.filter(n => !n.read).length
    };
  }

  /**
   * Rate order
   */
  rateOrder(orderId: string, ratings: NonNullable<OrderTracking['ratings']>) {
    const tracking = this.orders.get(orderId);
    if (tracking) {
      tracking.ratings = ratings;
      return true;
    }
    return false;
  }

  /**
   * Cancel order
   */
  cancelOrder(orderId: string, reason?: string) {
    const tracking = this.orders.get(orderId);
    if (tracking) {
      tracking.status = 'cancelled';
      tracking.deliveryStatus = 'cancelled';
      
      // Add cancellation to timeline
      tracking.timeline.push({
        status: 'cancelled',
        timestamp: new Date().toISOString(),
        message: 'Order Cancelled',
        description: reason || 'Order has been cancelled',
        icon: 'XCircle',
        completed: true,
        current: true
      });
      
      // Notify listeners
      this.notifyListeners(orderId, {
        orderId,
        type: 'status',
        data: { status: 'cancelled', reason },
        timestamp: new Date().toISOString()
      });
      
      return true;
    }
    return false;
  }
}

// Singleton instance
export const orderTrackingManager = new OrderTrackingManager();

// React hook for order tracking
export function useOrderTracking(orderId: string) {
  const [tracking, setTracking] = React.useState<OrderTracking | null>(null);
  const [stats, setStats] = React.useState<ReturnType<typeof orderTrackingManager.getOrderStats>>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Load initial tracking data
    setLoading(true);
    const trackingData = orderTrackingManager.getTracking(orderId);
    setTracking(trackingData);
    setStats(orderTrackingManager.getOrderStats(orderId));
    setLoading(false);

    // Subscribe to updates
    const unsubscribe = orderTrackingManager.subscribe(orderId, (update) => {
      // Refresh tracking data on update
      const newTracking = orderTrackingManager.getTracking(orderId);
      setTracking(newTracking);
      setStats(orderTrackingManager.getOrderStats(orderId));
    });

    // Update stats periodically
    const statsInterval = setInterval(() => {
      setStats(orderTrackingManager.getOrderStats(orderId));
    }, 10000); // Every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };

  }, [orderId]);

  const updateStatus = React.useCallback((status: DeliveryStatus) => {
    orderTrackingManager.updateStatus(orderId, status);
  }, [orderId]);

  const rateOrder = React.useCallback((ratings: NonNullable<OrderTracking['ratings']>) => {
    return orderTrackingManager.rateOrder(orderId, ratings);
  }, [orderId]);

  const cancelOrder = React.useCallback((reason?: string) => {
    return orderTrackingManager.cancelOrder(orderId, reason);
  }, [orderId]);

  const markNotificationRead = React.useCallback((notificationId: string) => {
    orderTrackingManager.markNotificationRead(orderId, notificationId);
  }, [orderId]);

  return {
    tracking,
    stats,
    loading,
    updateStatus,
    rateOrder,
    cancelOrder,
    markNotificationRead
  };
}

// Utility functions
export function getStatusColor(status: DeliveryStatus): string {
  switch (status) {
    case 'delivered':
      return 'text-green-600';
    case 'cancelled':
      return 'text-red-600';
    case 'on_the_way':
    case 'arriving_soon':
      return 'text-blue-600';
    case 'preparing_food':
    case 'food_ready':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
}

export function getStatusBadgeColor(status: OrderStatus): string {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
    case 'refunded':
      return 'bg-red-100 text-red-800';
    case 'confirmed':
    case 'preparing':
      return 'bg-blue-100 text-blue-800';
    case 'out_for_delivery':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = Math.floor((now - time) / 1000); // seconds
  
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function formatETA(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = Math.floor((time - now) / 1000 / 60); // minutes
  
  if (diff <= 0) return 'Any moment now';
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)} hr ${diff % 60} min`;
}