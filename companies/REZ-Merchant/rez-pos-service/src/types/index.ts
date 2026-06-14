// Type definitions for the POS Service

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid' | 'voided';
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'split';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
export type DiscountType = 'percentage' | 'fixed';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  modifiers?: ItemModifier[];
  available: boolean;
}

export interface ItemModifier {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: ItemModifier[];
  modifierPrice: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: Date;
  updatedAt: Date;
}

export interface Discount {
  id: string;
  code?: string;
  type: DiscountType;
  value: number;
  description: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableItems?: string[];
  createdAt: Date;
}

export interface BillSplit {
  id: string;
  items: OrderItem[];
  amount: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paid: boolean;
  paidAt?: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  tip?: number;
  status: PaymentStatus;
  transactionId?: string;
  splitId?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface BillCalculation {
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
}

export interface Receipt {
  orderId: string;
  receiptNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  payments: Payment[];
  orderDate: Date;
  printedAt?: Date;
  splitInfo?: BillSplit[];
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  discountId?: string;
  total: number;
  payments: Payment[];
  splits: BillSplit[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  voidedBy?: string;
}

export interface CreateOrderRequest {
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items?: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  modifiers?: { id: string; name: string; price: number }[];
  notes?: string;
}

export interface AddItemRequest {
  menuItemId: string;
  quantity: number;
  modifiers?: { id: string; name: string; price: number }[];
  notes?: string;
}

export interface ApplyDiscountRequest {
  discountCode?: string;
  discountType: DiscountType;
  value: number;
  description: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  applicableItems?: string[];
}

export interface SplitBillRequest {
  type: 'byItem' | 'byAmount' | 'equal';
  splitCount?: number;
  itemIds?: string[];
  amounts?: number[];
}

export interface ProcessPaymentRequest {
  method: PaymentMethod;
  amount: number;
  tip?: number;
  splitId?: string;
  transactionId?: string;
  metadata?: Record<string, unknown>;
}

export interface VoidOrderRequest {
  reason: string;
  voidedBy: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  refundedBy: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface MenuDatabase {
  [itemId: string]: MenuItem;
}
