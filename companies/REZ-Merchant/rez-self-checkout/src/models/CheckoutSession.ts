import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICheckoutItem {
  productId: string;
  sku: string;
  name: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  total: number;
  scannedAt: Date;
}

export interface ICheckoutSession extends Document {
  storeId: string;
  deviceId: string;
  sessionId: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  items: ICheckoutItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod?: string;
  transactionId?: string;
  customerId?: string;
  startedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
  exitCode?: string;
  exitValidatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CheckoutItemSchema = new Schema<ICheckoutItem>(
  {
    productId: { type: String, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    barcode: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    scannedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CheckoutSessionSchema = new Schema<ICheckoutSession>(
  {
    storeId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'expired'],
      default: 'active',
      index: true,
    },
    items: { type: [CheckoutItemSchema], default: [] },
    subtotal: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: { type: String },
    transactionId: { type: String, index: true },
    customerId: { type: String, index: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    expiresAt: { type: Date, required: true, index: true },
    exitCode: { type: String },
    exitValidatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for session management
CheckoutSessionSchema.index({ status: 1, expiresAt: 1 });
CheckoutSessionSchema.index({ storeId: 1, deviceId: 1, status: 1 });
CheckoutSessionSchema.index({ exitCode: 1 }, { sparse: true });

// TTL index to auto-delete expired sessions after 24 hours
CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

export const CheckoutSession: Model<ICheckoutSession> = mongoose.model<ICheckoutSession>(
  'CheckoutSession',
  CheckoutSessionSchema
);
