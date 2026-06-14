import mongoose, { Document, Schema } from 'mongoose';

// Session status enum
export type SessionStatus = 'active' | 'completed' | 'cancelled' | 'syncing' | 'timeout';

// Payment method enum
export type PaymentMethod = 'upi' | 'wallet' | 'card' | 'split' | 'cash';

// Cart item embedded document
export interface IGoCartItem {
  productId: string;
  barcode: string;
  name: string;
  price: number;
  mrp?: number;
  quantity: number;
  weight?: number;
  cashbackPercent: number;
  cashbackAmount: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  scannedAt: Date;
}

// Savings breakdown embedded document
export interface ISavingsBreakdown {
  totalMRP: number;
  totalPaid: number;
  cashbackEarned: number;
  totalSaved: number;
  coinsRedeemed: number;
}

// Go Session document interface
export interface IGoSession extends Document {
  sessionId: string;
  userId: string;
  storeId: string;
  storeName: string;
  merchantId: string;
  status: SessionStatus;
  items: IGoCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  cashbackEarned: number;
  coinsRedeemed: number;
  savings: ISavingsBreakdown;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  exitVerified: boolean;
  exitVerifiedAt?: Date;
  exitVerifiedBy?: string;
  fraudScore: number;
  auditRequired: boolean;
  auditPassed?: boolean;
  startedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  lastActivityAt: Date;
  deviceInfo?: {
    deviceId: string;
    platform: string;
    appVersion: string;
  };
  location?: {
    entryLat: number;
    entryLng: number;
    exitLat?: number;
    exitLng?: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const GoCartItemSchema = new Schema<IGoCartItem>(
  {
    productId: { type: String, required: true },
    barcode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    weight: { type: Number },
    cashbackPercent: { type: Number, default: 0 },
    cashbackAmount: { type: Number, default: 0 },
    imageUrl: { type: String },
    category: { type: String },
    brand: { type: String },
    scannedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SavingsBreakdownSchema = new Schema<ISavingsBreakdown>(
  {
    totalMRP: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    cashbackEarned: { type: Number, default: 0 },
    totalSaved: { type: Number, default: 0 },
    coinsRedeemed: { type: Number, default: 0 },
  },
  { _id: false }
);

const DeviceInfoSchema = new Schema(
  {
    deviceId: { type: String },
    platform: { type: String },
    appVersion: { type: String },
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    entryLat: { type: Number },
    entryLng: { type: Number },
    exitLat: { type: Number },
    exitLng: { type: Number },
  },
  { _id: false }
);

const GoSessionSchema = new Schema<IGoSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    storeId: { type: String, required: true, index: true },
    storeName: { type: String, required: true },
    merchantId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'syncing', 'timeout'],
      default: 'active',
      index: true,
    },
    items: [GoCartItemSchema],
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    cashbackEarned: { type: Number, default: 0 },
    coinsRedeemed: { type: Number, default: 0 },
    savings: { type: SavingsBreakdownSchema, default: () => ({}) },
    paymentMethod: {
      type: String,
      enum: ['upi', 'wallet', 'card', 'split', 'cash'],
    },
    paymentId: { type: String, index: true },
    exitVerified: { type: Boolean, default: false },
    exitVerifiedAt: { type: Date },
    exitVerifiedBy: { type: String },
    fraudScore: { type: Number, default: 0, min: 0, max: 100 },
    auditRequired: { type: Boolean, default: false },
    auditPassed: { type: Boolean },
    startedAt: { type: Date, default: Date.now, index: true },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
    deviceInfo: DeviceInfoSchema,
    location: LocationSchema,
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
GoSessionSchema.index({ userId: 1, status: 1 });
GoSessionSchema.index({ storeId: 1, status: 1 });
GoSessionSchema.index({ merchantId: 1, startedAt: -1 });
GoSessionSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 7200 }); // 2 hour TTL for active sessions

export const GoSession = mongoose.model<IGoSession>('GoSession', GoSessionSchema);
