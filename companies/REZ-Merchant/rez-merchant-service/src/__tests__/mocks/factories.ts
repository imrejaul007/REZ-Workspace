import { Types } from 'mongoose';
import { OrderStatus, PaymentStatus, VerificationStatus, StoreType } from '@rez/shared-types';

/**
 * Mock Factory for test data generation
 * Provides factory functions for Store, Order, Product, and Customer models
 */

// =============================================================================
// Customer Mock
// =============================================================================

export interface MockCustomer {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockCustomer = (overrides: Partial<MockCustomer> = {}): MockCustomer => {
  const id = new Types.ObjectId();
  return {
    _id: id,
    name: 'John Doe',
    email: `john.doe.${id.toString().slice(-6)}@example.com`,
    phone: '+919876543210',
    walletBalance: 1000,
    loyaltyPoints: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// =============================================================================
// Store Mock
// =============================================================================

export interface MockStore {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  banner?: string[];
  category: string;
  subcategories?: string[];
  deletedAt?: Date;
  location: {
    address: string;
    city: string;
    state?: string;
    pincode?: string;
    coordinates?: [number, number];
    deliveryRadius?: number;
    landmark?: string;
  };
  contact?: { phone?: string; email?: string; website?: string; whatsapp?: string };
  operationalInfo?: {
    hours?: Record<string, { open: string; close: string }>;
    dineIn?: boolean;
    delivery?: boolean;
    takeaway?: boolean;
    orderingMode?: string[];
  };
  ratings?: { average: number; count: number };
  offers?: { cashback?: number; minOrderAmount?: number; maxCashback?: number; isPartner?: boolean };
  isActive: boolean;
  isListed: boolean;
  isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  tags?: string[];
  features?: string[];
  storeType?: StoreType;
  fssaiNumber?: string;
  gstNumber?: string;
  acceptsOnlineOrders?: boolean;
  acceptsScanPay?: boolean;
  showLoyaltyStamps?: boolean;
  deliveryEnabled?: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
  storeLatitude?: number;
  storeLongitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockStore = (overrides: Partial<MockStore> = {}): MockStore => {
  const id = new Types.ObjectId();
  const merchantId = new Types.ObjectId();
  return {
    _id: id,
    merchantId,
    name: 'Test Store',
    slug: `test-store-${id.toString().slice(-8)}`,
    description: 'A test store for unit testing',
    category: 'restaurant',
    location: {
      address: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      coordinates: [72.8777, 19.0760],
      deliveryRadius: 5,
      landmark: 'Near Test Mall',
    },
    contact: {
      phone: '+919876543210',
      email: 'test@store.com',
      website: 'https://teststore.com',
      whatsapp: '+919876543210',
    },
    isActive: true,
    isListed: true,
    isVerified: true,
    verificationStatus: VerificationStatus.APPROVED,
    tags: ['test', 'mock'],
    features: ['delivery', 'takeaway'],
    storeType: StoreType.RESTAURANT,
    acceptsOnlineOrders: true,
    acceptsScanPay: true,
    showLoyaltyStamps: true,
    deliveryEnabled: true,
    deliveryRadiusKm: 5,
    deliveryFee: 50,
    storeLatitude: 19.0760,
    storeLongitude: 72.8777,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// =============================================================================
// Product Mock
// =============================================================================

export interface MockProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface MockModifier {
  name: string;
  price: number;
  isAvailable: boolean;
  calories?: number;
  image?: string;
  sortOrder?: number;
}

export interface MockModifierGroup {
  name: string;
  type: 'single' | 'multiple';
  minSelections: number;
  maxSelections: number;
  modifiers: MockModifier[];
  isActive: boolean;
  sortOrder?: number;
}

export interface MockProduct {
  _id: Types.ObjectId;
  store: Types.ObjectId;
  merchant: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  images: MockProductImage[];
  pricing: {
    original: number;
    selling: number;
    discount?: number;
    currency: string;
  };
  inventory: {
    stock: number;
    isAvailable: boolean;
    lowStockThreshold?: number;
    variants?: unknown[];
    unlimited: boolean;
  };
  ratings?: { average: number; count: number };
  sku?: string;
  barcode?: string;
  tags?: string[];
  isActive: boolean;
  isVeg?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  preparationTime?: number;
  weight?: number;
  itemType?: string;
  modifierGroups?: MockModifierGroup[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockProduct = (overrides: Partial<MockProduct> = {}): MockProduct => {
  const id = new Types.ObjectId();
  const storeId = new Types.ObjectId();
  const merchantId = new Types.ObjectId();
  return {
    _id: id,
    store: storeId,
    merchant: merchantId,
    name: 'Test Product',
    slug: `test-product-${id.toString().slice(-8)}`,
    description: 'A test product for unit testing',
    category: 'main-course',
    subcategory: 'biryani',
    images: [
      { url: 'https://example.com/product.jpg', alt: 'Test Product', isPrimary: true },
    ],
    pricing: {
      original: 200,
      selling: 150,
      discount: 25,
      currency: 'INR',
    },
    inventory: {
      stock: 100,
      isAvailable: true,
      lowStockThreshold: 10,
      unlimited: false,
    },
    ratings: { average: 4.5, count: 50 },
    sku: `MRS-${id.toString().slice(-8).toUpperCase()}`,
    tags: ['test', 'biryani', 'spicy'],
    isActive: true,
    isVeg: false,
    isFeatured: true,
    sortOrder: 1,
    preparationTime: 30,
    itemType: 'product',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// =============================================================================
// Order Mock
// =============================================================================

export interface MockOrderItem {
  product: Types.ObjectId;
  store?: Types.ObjectId;
  name: string;
  image: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant?: { type: string; value: string };
}

export interface MockOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  requestId?: string;
  user: Types.ObjectId;
  store: Types.ObjectId;
  merchant: Types.ObjectId;
  items: MockOrderItem[];
  totals: {
    subtotal: number;
    tax: number;
    delivery: number;
    discount: number;
    cashback: number;
    total: number;
    paidAmount: number;
    platformFee: number;
    merchantPayout: number;
  };
  payment: {
    method: string;
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: Date;
  };
  status: OrderStatus;
  deliveryAddress?;
  deliveryType?: string;
  notes?: string;
  timeline: Array<{ status: string; timestamp: Date; note?: string }>;
  statusHistory?: Array<{ status: string; timestamp: Date; note?: string; changedBy?: string }>;
  estimatedDelivery?: Date;
  isAnonymized?: boolean;
  anonymizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockOrder = (overrides: Partial<MockOrder> = {}): MockOrder => {
  const id = new Types.ObjectId();
  const userId = new Types.ObjectId();
  const storeId = new Types.ObjectId();
  const merchantId = new Types.ObjectId();
  const productId = new Types.ObjectId();
  const orderNumber = `ORD-${Date.now()}-${id.toString().slice(-4)}`;

  return {
    _id: id,
    orderNumber,
    user: userId,
    store: storeId,
    merchant: merchantId,
    items: [
      {
        product: productId,
        store: storeId,
        name: 'Test Biryani',
        image: 'https://example.com/biryani.jpg',
        quantity: 2,
        price: 150,
        subtotal: 300,
        variant: { type: 'size', value: 'full' },
      },
    ],
    totals: {
      subtotal: 300,
      tax: 27,
      delivery: 50,
      discount: 30,
      cashback: 15,
      total: 347,
      paidAmount: 347,
      platformFee: 17.35,
      merchantPayout: 264.65,
    },
    payment: {
      method: 'upi',
      status: PaymentStatus.COMPLETED,
      transactionId: `TXN-${id.toString().slice(-12).toUpperCase()}`,
      paidAt: new Date(),
    },
    status: OrderStatus.PLACED,
    deliveryType: 'delivery',
    notes: 'Extra spicy please',
    timeline: [
      { status: 'placed', timestamp: new Date(), note: 'Order placed' },
    ],
    statusHistory: [
      { status: 'placed', timestamp: new Date(), note: 'Order placed', changedBy: 'system' },
    ],
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

// =============================================================================
// Re-export all mocks
// =============================================================================

export const mockFactories = {
  createMockCustomer,
  createMockStore,
  createMockProduct,
  createMockOrder,
};

export default mockFactories;
