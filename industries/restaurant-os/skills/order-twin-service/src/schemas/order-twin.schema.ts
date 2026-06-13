// Order Twin Schema - Defines types and validation for Order Twin Service

export enum OrderStatus {
  RECEIVED = 'received',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
  QR = 'qr',
  KIOSK = 'kiosk'
}

export enum OrderSource {
  POS = 'pos',
  QR = 'qr',
  KIOSK = 'kiosk',
  WHATSAPP = 'whatsapp',
  DELIVERY_APP = 'delivery_app'
}

export enum ItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded'
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: string[];
  specialInstructions?: string;
  status: ItemStatus;
  stationId?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface OrderTiming {
  createdAt: string;
  confirmedAt?: string;
  startedAt?: string;
  readyAt?: string;
  servedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface PaymentMethod {
  method: 'cash' | 'card' | 'upi' | 'wallet' | 'points';
  amount: number;
  transactionId?: string;
}

export interface OrderTwinDocument {
  twinId: string;
  orderId: string;
  restaurantId: string;
  orderNumber: string;
  orderType: OrderType;
  source: OrderSource;
  status: OrderStatus;
  tableId?: string;
  customerId?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  timing: OrderTiming;
  paymentStatus: PaymentStatus;
  paymentMethods: PaymentMethod[];
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  notes?: string;
  priority?: 'normal' | 'rush' | 'vip';
  createdAt: string;
  updatedAt: string;
}

// Request/Response Types
export interface CreateOrderRequest {
  restaurantId: string;
  orderType: OrderType;
  source: OrderSource;
  tableId?: string;
  customerId?: string;
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiers?: string[];
    specialInstructions?: string;
  }[];
  priority?: 'normal' | 'rush' | 'vip';
  notes?: string;
}

export interface CreateOrderResponse {
  twinId: string;
  orderId: string;
  orderNumber: string;
  twinOsEntityId: string;
  status: OrderStatus;
  createdAt: string;
}

export interface GetOrderResponse extends OrderTwinDocument {
  twinOsEntityId: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
}

export interface UpdateOrderStatusResponse {
  twinId: string;
  orderId: string;
  status: OrderStatus;
  timing: OrderTiming;
  updatedAt: string;
}

export interface AddItemsRequest {
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    modifiers?: string[];
    specialInstructions?: string;
  }[];
}

export interface AddItemsResponse {
  twinId: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  updatedAt: string;
}

export interface UpdateItemStatusRequest {
  menuItemId: string;
  status: ItemStatus;
}

export interface ProcessPaymentRequest {
  paymentMethod: PaymentMethod['method'];
  amount: number;
  transactionId?: string;
}

export interface ProcessPaymentResponse {
  twinId: string;
  orderId: string;
  paymentStatus: PaymentStatus;
  paymentMethods: PaymentMethod[];
  totalPaid: number;
  remainingBalance: number;
  updatedAt: string;
}

export interface ListOrdersRequest {
  restaurantId: string;
  status?: OrderStatus;
  orderType?: OrderType;
  tableId?: string;
  customerId?: string;
  date?: string;
  limit?: number;
  offset?: number;
}

export interface ListOrdersResponse {
  orders: OrderTwinDocument[];
  total: number;
  totalAmount: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  averagePrepTime: number;
  totalRevenue: number;
  topItems: { menuItemId: string; name: string; count: number }[];
}

// Default values
export const defaultTiming: OrderTiming = {
  createdAt: new Date().toISOString()
};

export const defaultPaymentMethods: PaymentMethod[] = [];
