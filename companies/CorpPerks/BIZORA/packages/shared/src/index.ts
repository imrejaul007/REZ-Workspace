/**
 * BIZORA Shared Types & Utilities
 * Canonical type definitions for all BIZORA services
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Base Types
// ============================================================================

export const BaseSchema = z.object({
  id: z.string().default(() => uuidv4()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Base = z.infer<typeof BaseSchema>;

// ============================================================================
// User & Business Types
// ============================================================================

export const UserTypeSchema = z.enum(['business_owner', 'agency', 'admin', 'support']);
export type UserType = z.infer<typeof UserTypeSchema>;

export const UserSchema = BaseSchema.extend({
  email: z.string().email(),
  phone: z.string().min(10),
  name: z.string().min(2),
  type: UserTypeSchema,
  avatar: z.string().url().optional(),
  businessId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type User = z.infer<typeof UserSchema>;

export const BusinessTypeSchema = z.enum([
  'proprietorship',
  'partnership',
  'llp',
  'pvt_ltd',
  'public_ltd',
  'section_8',
  'opc'
]);
export type BusinessType = z.infer<typeof BusinessTypeSchema>;

export const IndustrySchema = z.enum([
  'restaurant',
  'salon',
  'hotel',
  'healthcare',
  'retail',
  'ecommerce',
  'services',
  'manufacturing',
  'technology',
  'finance',
  'education',
  'other'
]);
export type Industry = z.infer<typeof IndustrySchema>;

export const BusinessSchema = BaseSchema.extend({
  name: z.string().min(2),
  type: BusinessTypeSchema,
  industry: IndustrySchema,

  // Registration Details
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  tan: z.string().optional(),

  // Contact
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  website: z.string().url().optional(),

  // Address
  address: AddressSchema.optional(),

  // Status
  status: z.enum(['active', 'inactive', 'pending_verification']).default('pending_verification'),

  // Subscription
  plan: z.enum(['starter', 'business', 'growth', 'enterprise']).default('starter'),
  subscriptionEndsAt: z.date().optional(),

  // Stats
  employeeCount: z.number().min(0).default(0),
  monthlyRevenue: z.number().min(0).default(0),
});
export type Business = z.infer<typeof BusinessSchema>;

export const AddressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  country: z.string().default('India'),
  pincode: z.string().regex(/^[0-9]{6}$/),
});
export type Address = z.infer<typeof AddressSchema>;

// ============================================================================
// Marketplace Types
// ============================================================================

export const ServiceCategorySchema = z.enum([
  'business_setup',
  'compliance',
  'marketing',
  'technology',
  'finance',
  'legal',
  'operations',
  'creative'
]);
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const AgencySchema = BaseSchema.extend({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  logo: z.string().url().optional(),
  description: z.string(),

  // Categories
  categories: z.array(ServiceCategorySchema).min(1),
  subcategories: z.array(z.string()),

  // Location
  location: z.object({
    country: z.string(),
    city: z.string(),
    state: z.string().optional(),
  }),

  // Reputation
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().min(0).default(0),
  completedOrders: z.number().min(0).default(0),

  // Verification
  verified: z.boolean().default(false),
  verificationDocuments: z.array(z.string()).optional(),

  // Pricing
  pricing: z.object({
    minOrder: z.number().min(0),
    maxOrder: z.number().optional(),
    currency: z.string().default('INR'),
  }),

  // Performance
  responseTime: z.number().min(0).default(60), // minutes
  completionRate: z.number().min(0).max(1).default(0),

  // Status
  status: z.enum(['active', 'suspended', 'inactive']).default('active'),

  // Owner
  ownerId: z.string(),
});
export type Agency = z.infer<typeof AgencySchema>;

export const AgencyPackageSchema = BaseSchema.extend({
  agencyId: z.string(),
  name: z.string().min(2),
  description: z.string(),
  price: z.number().min(0),
  originalPrice: z.number().optional(),
  currency: z.string().default('INR'),
  duration: z.string(), // "7 days", "1 month"
  deliverables: z.array(z.string()),
  includes: z.array(z.string()),
  isActive: z.boolean().default(true),
});
export type AgencyPackage = z.infer<typeof AgencyPackageSchema>;

export const ServiceSchema = BaseSchema.extend({
  agencyId: z.string(),
  category: ServiceCategorySchema,
  subcategory: z.string(),
  name: z.string().min(2),
  description: z.string(),
  price: z.number().min(0),
  priceType: z.enum(['fixed', 'starting_from', 'starting_at']).default('fixed'),
  currency: z.string().default('INR'),
  duration: z.string(),
  deliverables: z.array(z.string()),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});
export type Service = z.infer<typeof ServiceSchema>;

export const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'review',
  'completed',
  'cancelled'
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = BaseSchema.extend({
  orderNumber: z.string(),
  customerId: z.string(),
  agencyId: z.string(),
  serviceId: z.string(),
  packageId: z.string().optional(),
  status: OrderStatusSchema.default('pending'),

  // Pricing
  pricing: z.object({
    basePrice: z.number(),
    addons: z.number().default(0),
    discount: z.number().default(0),
    platformFee: z.number().default(0),
    total: z.number(),
    currency: z.string().default('INR'),
  }),

  // Timeline
  milestones: z.array(MilestoneSchema).optional(),

  // Customer Details
  customerDetails: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string(),
    notes: z.string().optional(),
  }),

  // Completion
  completedAt: z.date().optional(),
  rating: z.object({
    score: z.number().min(1).max(5),
    review: z.string().optional(),
  }).optional(),
});
export type Order = z.infer<typeof OrderSchema>;

export const MilestoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number(),
  status: z.enum(['pending', 'in_progress', 'submitted', 'approved', 'revision']).default('pending'),
  dueDate: z.date(),
  completedAt: z.date().optional(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

// ============================================================================
// Tax & Compliance Types
// ============================================================================

export const FilingTypeSchema = z.enum([
  'GSTR-1',
  'GSTR-3B',
  'GSTR-9',
  'GSTR-9C',
  'TDS',
  'TDS-QUARTERLY'
]);
export type FilingType = z.infer<typeof FilingTypeSchema>;

export const FilingStatusSchema = z.enum([
  'draft',
  'prepared',
  'filed',
  'accepted',
  'rejected',
  'pending'
]);
export type FilingStatus = z.infer<typeof FilingStatusSchema>;

export const FilingSchema = BaseSchema.extend({
  businessId: z.string(),
  filingType: FilingTypeSchema,
  period: z.string(), // "052024" for May 2024
  status: FilingStatusSchema.default('draft'),

  dueDate: z.date(),
  filedDate: z.date().optional(),
  acknowledgmentNumber: z.string().optional(),

  // Tax Summary
  summary: z.object({
    totalTaxableValue: z.number().default(0),
    totalCgst: z.number().default(0),
    totalSgst: z.number().default(0),
    totalIgst: z.number().default(0),
    totalCess: z.number().default(0),
    totalLiability: z.number().default(0),
    itcAvailable: z.number().default(0),
    itcClaimed: z.number().default(0),
    cashBalance: z.number().default(0),
    totalTaxPayable: z.number().default(0),
  }),

  // Filing Data
  invoices: z.array(InvoiceRecordSchema).optional(),

  // Metadata
  filedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
});
export type Filing = z.infer<typeof FilingSchema>;

export const InvoiceRecordSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  invoiceDate: z.date(),
  customerGstin: z.string().optional(),
  customerName: z.string(),
  invoiceType: z.enum(['b2b', 'b2c', 'export', 'nil', 'composition']),
  supplyType: z.enum(['interstate', 'intrastate']),
  totalTaxableValue: z.number(),
  rate: z.number(),
  cgst: z.number().default(0),
  sgst: z.number().default(0),
  igst: z.number().default(0),
  cess: z.number().default(0),
  totalAmount: z.number(),
  placeOfSupply: z.string(),
  reverseCharge: z.boolean().default(false),
});
export type InvoiceRecord = z.infer<typeof InvoiceRecordSchema>;

// ============================================================================
// Invoice Types
// ============================================================================

export const InvoiceTypeSchema = z.enum([
  'tax_invoice',
  'bill_of_supply',
  'export_invoice',
  'credit_note',
  'debit_note'
]);
export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;

export const InvoiceStatusSchema = z.enum([
  'draft',
  'issued',
  'viewed',
  'paid',
  'overdue',
  'cancelled'
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceSchema = BaseSchema.extend({
  invoiceNumber: z.string(),
  businessId: z.string(),
  customerId: z.string().optional(),

  type: InvoiceTypeSchema.default('tax_invoice'),
  status: InvoiceStatusSchema.default('draft'),

  // Dates
  invoiceDate: z.date(),
  dueDate: z.date(),

  // Customer
  customer: z.object({
    name: z.string(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional(),
    pan: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),

  // Items
  items: z.array(InvoiceItemSchema),

  // Totals
  subtotal: z.number(),
  discount: z.number().default(0),
  taxableValue: z.number(),
  taxBreakdown: z.object({
    cgst: z.object({ rate: z.number(), amount: z.number() }),
    sgst: z.object({ rate: z.number(), amount: z.number() }),
    igst: z.object({ rate: z.number(), amount: z.number() }),
    cess: z.object({ rate: z.number(), amount: z.number() }),
  }),
  totalTax: z.number(),
  totalAmount: z.number(),
  amountInWords: z.string().optional(),

  // Payment
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).default('unpaid'),
  paidAmount: z.number().default(0),
  paymentTerms: z.string().optional(),

  // E-invoice
  eInvoiceNumber: z.string().optional(),
  ackNumber: z.string().optional(),
  ackDate: z.date().optional(),
  irn: z.string().optional(),

  // Notes
  notes: z.string().optional(),
  terms: z.string().optional(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  hsnCode: z.string().optional(),
  quantity: z.number().min(1),
  unit: z.string().default('pcs'),
  rate: z.number(),
  discount: z.number().default(0),
  taxableAmount: z.number(),
  taxRate: z.number(),
  cgst: z.number().default(0),
  sgst: z.number().default(0),
  igst: z.number().default(0),
  cess: z.number().default(0),
  total: z.number(),
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

// ============================================================================
// Chat & AI Types
// ============================================================================

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const IntentCategorySchema = z.enum([
  'business_setup',
  'compliance',
  'marketing',
  'technology',
  'finance',
  'legal',
  'operations',
  'general'
]);
export type IntentCategory = z.infer<typeof IntentCategorySchema>;

export const MessageSchema = BaseSchema.extend({
  conversationId: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  intent: IntentCategorySchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = BaseSchema.extend({
  userId: z.string(),
  channel: z.enum(['web', 'whatsapp', 'mobile']).default('web'),
  status: z.enum(['active', 'closed', 'pending']).default('active'),
  context: z.record(z.unknown()).optional(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const IntentSchema = z.object({
  category: IntentCategorySchema,
  subcategory: z.string().optional(),
  confidence: z.number().min(0).max(1),
  entities: z.record(z.string()).optional(),
  response: z.string().optional(),
  actions: z.array(z.object({
    type: z.string(),
    data: z.record(z.unknown()),
  })).optional(),
});
export type Intent = z.infer<typeof IntentSchema>;

// ============================================================================
// Vertical SaaS Types
// ============================================================================

// Restaurant
export const TableSchema = z.object({
  id: z.string(),
  number: z.string(),
  capacity: z.number(),
  status: z.enum(['available', 'occupied', 'reserved', 'blocked']),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});
export type Table = z.infer<typeof TableSchema>;

export const OrderTypeSchema = z.enum(['dine_in', 'takeaway', 'delivery']);
export type OrderType = z.infer<typeof OrderTypeSchema>;

export const RestaurantOrderSchema = BaseSchema.extend({
  orderNumber: z.string(),
  type: OrderTypeSchema,
  tableId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled']),

  customer: z.object({
    name: z.string(),
    phone: z.string().optional(),
  }).optional(),

  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    modifiers: z.array(z.string()).optional(),
    notes: z.string().optional(),
    status: z.enum(['pending', 'preparing', 'done']).default('pending'),
  })),

  subtotal: z.number(),
  tax: z.number(),
  discount: z.number().default(0),
  total: z.number(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.enum(['pending', 'partial', 'paid']).default('pending'),
});
export type RestaurantOrder = z.infer<typeof RestaurantOrderSchema>;

// Salon
export const AppointmentSchema = BaseSchema.extend({
  customerId: z.string(),
  customer: z.object({
    name: z.string(),
    phone: z.string(),
    email: z.string().email().optional(),
  }),

  date: z.date(),
  startTime: z.string(),
  endTime: z.string(),

  services: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    duration: z.number(), // minutes
    staffId: z.string(),
  })),

  staffId: z.string(),
  status: z.enum(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']),

  total: z.number(),
  paid: z.number().default(0),
  paymentStatus: z.enum(['pending', 'partial', 'paid']).default('pending'),

  notes: z.string().optional(),
  source: z.enum(['online', 'phone', 'walk_in', 'whatsapp']).default('online'),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

// Hotel
export const RoomTypeSchema = z.enum(['standard', 'deluxe', 'premium', 'suite', 'presidential']);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const RoomStatusSchema = z.enum(['available', 'occupied', 'vacant_dirty', 'out_of_order', 'reserved']);
export type RoomStatus = z.infer<typeof RoomStatusSchema>;

export const RoomSchema = z.object({
  id: z.string(),
  number: z.string(),
  floor: z.number(),
  type: RoomTypeSchema,
  status: RoomStatusSchema.default('available'),
  cleanliness: z.enum(['clean', 'dirty', 'inspected']).default('dirty'),

  baseRate: z.number(),
  maxOccupancy: z.number(),
  bedType: z.enum(['single', 'double', 'twin', 'suite']),
  amenities: z.array(z.string()),
});
export type Room = z.infer<typeof RoomSchema>;

export const BookingSchema = BaseSchema.extend({
  guestName: z.string(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string(),

  roomId: z.string(),
  checkInDate: z.date(),
  checkOutDate: z.date(),

  adults: z.number().default(1),
  children: z.number().default(0),

  status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']),

  roomRate: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number().default(0),
  paymentStatus: z.enum(['pending', 'partial', 'paid']).default('pending'),

  source: z.enum(['direct', 'booking.com', 'makemytrip', 'goibibo', 'other']).default('direct'),

  specialRequests: z.string().optional(),
});
export type Booking = z.infer<typeof BookingSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${random}`;
}

export function amountToWords(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundreds = (n: number): string => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + units[n % 10] : '');
  };

  const convertThousands = (n: number): string => {
    if (n < 1000) return convertHundreds(n);
    return units[Math.floor(n / 1000)] + ' Thousand' + (n % 1000 ? ' ' + convertHundreds(n % 1000) : '');
  };

  const convertLakhs = (n: number): string => {
    if (n < 100000) return convertThousands(n);
    return units[Math.floor(n / 100000)] + ' Lakh' + (n % 100000 ? ' ' + convertThousands(Math.floor(n % 100000)) : '');
  };

  if (amount === 0) return 'Zero';

  const crore = Math.floor(amount / 10000000);
  const remainder = amount % 10000000;

  let result = '';
  if (crore > 0) {
    result += units[crore] + ' Crore';
  }
  if (remainder > 0) {
    if (result) result += ' ';
    result += convertLakhs(Math.floor(remainder));
  }

  return result + ' Only';
}

export { z };
