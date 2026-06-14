import { z } from 'zod';

// ============================================
// QR Types
// ============================================

export const QRTypeEnum = z.enum(['menu', 'payment', 'info', 'verify', 'creator', 'ads', 'table']);
export type QRType = z.infer<typeof QRTypeEnum>;

// ============================================
// Merchant Types
// ============================================

export interface MerchantSettings {
  acceptOrders: boolean;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  tablesEnabled: boolean;
}

export interface MerchantTheme {
  primaryColor: string;
  secondaryColor: string;
}

export interface Merchant {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  type: 'restaurant' | 'hotel' | 'retail' | 'salon' | 'other';
  phone: string;
  email?: string;
  address?: string;
  logo?: string;
  apiKey?: string;
  settings?: MerchantSettings;
  theme?: MerchantTheme;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Zod schema for validation
export const CreateMerchantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  type: z.enum(['restaurant', 'hotel', 'retail', 'salon', 'other']),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  address: z.string().optional(),
  logo: z.string().url().optional(),
});

// ============================================
// QR Code Types
// ============================================

export interface QRCode {
  _id?: string;
  id?: string;
  merchantId: string;
  type: QRType;
  targetId?: string;
  name: string;
  url: string;
  shortCode?: string;
  qrCodeDataUrl?: string;
  metadata?: Record<string, string | number | boolean>;
  isActive: boolean;
  scans: number;
  createdAt: Date;
  updatedAt?: Date;
}

export const CreateQRSchema = z.object({
  type: QRTypeEnum,
  name: z.string().min(1).max(100),
  targetId: z.string().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// ============================================
// Menu Types
// ============================================

export interface MenuOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  _id?: string;
  id?: string;
  merchantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isVeg?: boolean;
  isBestseller?: boolean;
  preparationTime?: number;
  allergens?: string[];
  calories?: number;
  options?: MenuOption[];
  addons?: MenuAddon[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  _id?: string;
  id?: string;
  merchantId: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
}

export const CreateMenuItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  isVeg: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  preparationTime: z.number().min(0).optional(),
  allergens: z.array(z.string()).optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  image: z.string().url().optional(),
});

// ============================================
// Order Types
// ============================================

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  itemId?: string;
  _id?: string;
  name: string;
  quantity: number;
  price: number;
  options?: MenuOption[];
  addons?: MenuAddon[];
  notes?: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  _id?: string;
  id?: string;
  merchantId: string;
  customerId?: string;
  customerPhone: string;
  customerName?: string;
  type: OrderType;
  tableNumber?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  qrId?: string;
  deliveryAddress?: DeliveryAddress;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CreateOrderSchema = z.object({
  merchantId: z.string(),
  customerPhone: z.string().min(10).max(15),
  customerName: z.string().optional(),
  type: z.enum(['dine_in', 'takeaway', 'delivery']),
  tableNumber: z.string().optional(),
  qrId: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string().optional(),
    name: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    options: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
    })).optional(),
    addons: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
    })).optional(),
    notes: z.string().optional(),
  })).min(1),
  deliveryAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
  }).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
});

// ============================================
// Offer Types
// ============================================

export type OfferType = 'percentage' | 'flat' | 'buy_x_get_y' | 'free_item';

export interface Offer {
  _id?: string;
  id?: string;
  merchantId: string;
  qrId?: string;
  name: string;
  description?: string;
  type: OfferType;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt?: Date;
}

export const CreateOfferSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  type: z.enum(['percentage', 'flat', 'buy_x_get_y', 'free_item']),
  value: z.number().min(0),
  minOrderValue: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  usageLimit: z.number().min(1).optional(),
});

// ============================================
// Scan Event Types
// ============================================

export interface ScanLocation {
  lat: number;
  lng: number;
}

export interface ScanEvent {
  _id?: string;
  id?: string;
  qrId: string;
  merchantId: string;
  customerId?: string;
  deviceId?: string;
  location?: ScanLocation;
  timestamp: Date;
}

// ============================================
// API Response Types
// ============================================

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  count: number;
  page?: number;
  limit?: number;
  total?: number;
}

// ============================================
// Analytics Types
// ============================================

export interface QRAnalytics {
  qrId: string;
  totalScans: number;
  uniqueCustomers: number;
  totalOrders: number;
  orderValue: number;
  avgOrderValue: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
}

export interface MerchantAnalytics {
  totalQRCodes: number;
  totalScans: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: Order[];
  topQRCodes: QRCode[];
}

// ============================================
// Payment Types
// ============================================

export interface PaymentInitResult {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  orderId?: string;
  amount?: number;
}

export interface PaymentVerifyResult {
  success: boolean;
  status?: string;
  orderId?: string;
}
