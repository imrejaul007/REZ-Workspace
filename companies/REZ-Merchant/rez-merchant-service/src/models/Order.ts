import mongoose, { Schema, Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '@rez/shared-types';

// SECURITY FIX (MA-BACK-AUDIT-007): Replaced `any` with proper interfaces.

// Delivery address type
export interface DeliveryAddress {
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  coordinates?: { lat: number; lng: number };
  instructions?: string;
}

// Canonical enum value arrays for Mongoose schema
const ORDER_STATUS_VALUES: string[] = Object.values(OrderStatus);
const PAYMENT_STATUS_VALUES: string[] = Object.values(PaymentStatus);

export interface IOrder extends Document {
  orderNumber: string;
  requestId?: string;
  user: Types.ObjectId;
  store: Types.ObjectId;
  merchant: Types.ObjectId;
  items: Array<{
    product: Types.ObjectId;
    store?: Types.ObjectId;
    name: string;
    image: string;
    quantity: number;
    price: number;
    subtotal: number;
    variant?: { type: string; value: string };
  }>;
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
    // DB-HEALTH-025: Using canonical PaymentStatus enum from @rez/shared-types
    status: PaymentStatus;
    transactionId?: string;
    paidAt?: Date;
  };
  // DB-HEALTH-025: Using canonical OrderStatus enum from @rez/shared-types
  status: OrderStatus;
  deliveryAddress?: DeliveryAddress;
  deliveryType?: string;
  notes?: string;
  timeline: Array<{ status: string; timestamp: Date; note?: string }>;
  statusHistory?: Array<{ status: string; timestamp: Date; note?: string; changedBy?: string }>;
  estimatedDelivery?: Date;
  // GDPR: Anonymization fields for deleted merchants
  isAnonymized?: boolean;
  anonymizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    // MERCH-AUDIT-10: Idempotency key for POST /create-order (POS)
    requestId: { type: String, sparse: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    merchant: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        store: { type: Schema.Types.ObjectId, ref: 'Store' },
        name: String,
        image: String,
        quantity: Number,
        price: Number,
        subtotal: Number,
        variant: Schema.Types.Mixed,
      },
    ],
    totals: {
      subtotal: { type: Number, min: 0 },
      tax: { type: Number, min: 0 },
      delivery: { type: Number, min: 0 },
      discount: { type: Number, min: 0 },
      cashback: { type: Number, min: 0 },
      total: { type: Number, min: 0 },
      paidAmount: { type: Number, min: 0 },
      platformFee: { type: Number, min: 0 },
      merchantPayout: { type: Number, min: 0 },
    },
    payment: {
      method: String,
      // DB-HEALTH-025: Using canonical PaymentStatus enum from @rez/shared-types
      status: {
        type: String,
        enum: PAYMENT_STATUS_VALUES,
        default: PaymentStatus.PENDING,
      },
      transactionId: String,
      paidAt: Date,
    },
    // DB-HEALTH-025: Using canonical OrderStatus enum from @rez/shared-types
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: OrderStatus.PLACED,
    },
    deliveryAddress: Schema.Types.Mixed,
    deliveryType: String,
    notes: String,
    timeline: [{ status: String, timestamp: { type: Date, default: Date.now }, note: String }],
    statusHistory: [{ status: String, timestamp: { type: Date, default: Date.now }, note: String, changedBy: String }],
    estimatedDelivery: Date,

    // GDPR: Anonymization flag for deleted merchants
    isAnonymized: { type: Boolean, default: false },
    anonymizedAt: Date,
  },
  { timestamps: true, strict: true, strictQuery: true },
);

OrderSchema.index({ orderNumber: 1 }, { unique: true });
// MERCH-AUDIT-10: Sparse index for idempotency key — allows null/missing values while supporting efficient lookups
OrderSchema.index({ requestId: 1 }, { sparse: true, unique: true });
OrderSchema.index({ store: 1, createdAt: -1 });
OrderSchema.index({ merchant: 1, createdAt: -1 });
// CRIT-14 FIX: Removed invalid index on 'analytics.source' — field does not exist in schema
OrderSchema.index({ merchant: 1, 'payment.status': 1, createdAt: -1 });
OrderSchema.index({ store: 1, 'payment.status': 1, createdAt: -1 });
OrderSchema.index({ 'payment.status': 1 });
// DB-INDEX: Removed redundant { status: 1 } — covered by { status: 1, createdAt: -1 }
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ store: 1, status: 1, createdAt: -1 });
OrderSchema.index({ merchant: 1, status: 1, createdAt: -1 });
// DB-INDEX: Added user index for user order history queries
OrderSchema.index({ user: 1 });
// DB-INDEX: Added items.product index for product-level analytics
OrderSchema.index({ 'items.product': 1 });

// GDPR Data Retention: TTL index to auto-delete anonymized orders after 180 days
// Only applies to orders marked as anonymized (from deleted merchants)
// Note: Legal/compliance may require longer retention - adjust based on jurisdiction
OrderSchema.index(
  { anonymizedAt: 1 },
  { expireAfterSeconds: 180 * 24 * 60 * 60, partialFilterExpression: { anonymizedAt: { $exists: true }, isAnonymized: true } },
);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
