import { Document, Types } from 'mongoose';

// ============================================
// ENUMS & CONSTANTS
// ============================================

export enum CreatorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SOLD_OUT = 'sold_out'
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  WALLET = 'wallet'
}

// ============================================
// SOCIAL LINKS INTERFACE
// ============================================

export interface ISocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
  linkedin?: string;
  facebook?: string;
}

// ============================================
// BANK DETAILS INTERFACE
// ============================================

export interface IBankDetails {
  accountNumber: string;
  ifsc: string;
  bankName: string;
  accountHolder: string;
  upiId?: string;
}

// ============================================
// SHIPPING ADDRESS INTERFACE
// ============================================

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// ============================================
// TOP PRODUCT INTERFACE
// ============================================

export interface ITopProduct {
  productId: Types.ObjectId;
  count: number;
  name?: string;
  revenue?: number;
}

// ============================================
// EARNINGS BY DAY INTERFACE
// ============================================

export interface IEarningsByDay {
  date: Date;
  amount: number;
  orders: number;
}

// ============================================
// CREATOR INTERFACE
// ============================================

export interface ICreator {
  _id: Types.ObjectId;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  socialLinks: ISocialLinks;
  categories: string[];
  rating: number;
  totalProducts: number;
  totalOrders: number;
  totalEarnings: number;
  pendingPayout: number;
  status: CreatorStatus;
  onboardingComplete: boolean;
  bankDetails: IBankDetails;
  userId?: Types.ObjectId; // Reference to RABTUL Auth user
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatorDocument extends ICreator, Document {
  _id: Types.ObjectId;
}

// ============================================
// PRODUCT INTERFACE
// ============================================

export interface IProduct {
  _id: Types.ObjectId;
  creatorId: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  commission: number; // Percentage (0-100)
  commissionAmount: number; // Calculated: price * commission / 100
  inventory: number;
  soldCount: number;
  category: string;
  tags: string[];
  images: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {
  _id: Types.ObjectId;
}

// ============================================
// ORDER INTERFACE
// ============================================

export interface IOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  creatorId: Types.ObjectId;
  productId: Types.ObjectId;
  customerId: string;
  status: OrderStatus;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  netEarnings: number;
  quantity: number;
  customerEmail: string;
  customerName: string;
  shippingAddress?: IShippingAddress;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {
  _id: Types.ObjectId;
}

// ============================================
// ANALYTICS INTERFACE
// ============================================

export interface IAnalytics {
  _id: Types.ObjectId;
  creatorId: Types.ObjectId;
  date: Date;
  totalEarnings: number;
  totalOrders: number;
  totalProducts: number;
  conversionRate: number;
  pageViews: number;
  uniqueVisitors: number;
  topProducts: ITopProduct[];
  earningsByDay: IEarningsByDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnalyticsDocument extends IAnalytics, Document {
  _id: Types.ObjectId;
}

// ============================================
// PAYOUT INTERFACE
// ============================================

export interface IPayout {
  _id: Types.ObjectId;
  creatorId: Types.ObjectId;
  amount: number;
  status: PayoutStatus;
  method: PayoutMethod;
  transactionId?: string;
  bankReference?: string;
  notes?: string;
  failureReason?: string;
  requestedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayoutDocument extends IPayout, Document {
  _id: Types.ObjectId;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ============================================
// CREATE/UPDATE DTOs
// ============================================

export interface CreateCreatorDTO {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  socialLinks?: ISocialLinks;
  categories?: string[];
  bankDetails?: IBankDetails;
}

export interface UpdateCreatorDTO {
  name?: string;
  bio?: string;
  avatar?: string;
  socialLinks?: ISocialLinks;
  categories?: string[];
  status?: CreatorStatus;
  bankDetails?: IBankDetails;
}

export interface CreateProductDTO {
  creatorId: string;
  name: string;
  description?: string;
  price: number;
  commission: number;
  inventory: number;
  category?: string;
  tags?: string[];
  images?: string[];
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  commission?: number;
  inventory?: number;
  category?: string;
  tags?: string[];
  images?: string[];
  status?: ProductStatus;
}

export interface CreateOrderDTO {
  creatorId: string;
  productId: string;
  customerId: string;
  quantity?: number;
  customerEmail: string;
  customerName: string;
  shippingAddress?: IShippingAddress;
  notes?: string;
}

export interface UpdateOrderDTO {
  status?: OrderStatus;
  notes?: string;
}

export interface CreatePayoutDTO {
  creatorId: string;
  amount: number;
  method?: PayoutMethod;
  notes?: string;
}

export interface UpdatePayoutDTO {
  status?: PayoutStatus;
  transactionId?: string;
  bankReference?: string;
  notes?: string;
  failureReason?: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface CreatorAnalyticsSummary {
  totalEarnings: number;
  totalOrders: number;
  totalProducts: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: ITopProduct[];
  monthlyEarnings: IEarningsByDay[];
  pendingPayout: number;
  paidOut: number;
}

export interface PlatformAnalytics {
  totalCreators: number;
  activeCreators: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayouts: number;
}

// ============================================
// CACHE TYPES
// ============================================

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export interface CacheKey {
  creator: (id: string) => string;
  creators: (page: number, limit: number) => string;
  product: (id: string) => string;
  creatorProducts: (creatorId: string, page: number) => string;
  creatorOrders: (creatorId: string, page: number) => string;
  creatorAnalytics: (creatorId: string) => string;
  creatorPayouts: (creatorId: string) => string;
}