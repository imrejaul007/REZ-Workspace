// Order status types
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// Priority levels
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

// Kitchen order item
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  completed: boolean;
}

// Kitchen order model
export interface KitchenOrder {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  isDelayed: boolean;
  notes?: string;
  totalItems: number;
  completedItems: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Create order request
export interface CreateOrderRequest {
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  items: Omit<OrderItem, 'id' | 'completed'>[];
  priority?: Priority;
  estimatedTime?: number;
  notes?: string;
}

// Update order status request
export interface UpdateStatusRequest {
  status: OrderStatus;
}

// Timer event payload
export interface TimerEvent {
  type: 'tick' | 'delay_warning' | 'order_completed';
  orderId: string;
  elapsedTime: number;
  message?: string;
}

// WebSocket events
export interface WSOrderEvent {
  event: 'new_order' | 'order_updated' | 'order_completed' | 'order_cancelled' | 'delay_alert';
  data: KitchenOrder;
  timestamp: Date;
}
