import mongoose, { Document, Schema } from 'mongoose';

export interface ICheckout extends Document {
  checkoutId: string;
  userId: string;
  sessionId?: string;
  status: 'pending' | 'in_progress' | 'payment_pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  cart: {
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      sku?: string;
      imageUrl?: string;
      metadata?: Record<string, unknown>;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    shipping: number;
    total: number;
    currency: string;
  };
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  payment?: {
    method: 'upi' | 'card' | 'wallet' | 'netbanking' | 'cod';
    provider?: string;
    transactionId?: string;
    status: 'pending' | 'processing' | 'captured' | 'failed' | 'refunded';
    amount?: number;
  };
  couponCode?: string;
  couponDiscount?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  sku: String,
  imageUrl: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const checkoutSchema = new Schema<ICheckout>({
  checkoutId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, index: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'payment_pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'],
    default: 'pending'
  },
  cart: {
    items: [cartItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  shippingAddress: {
    name: String, line1: String, line2: String, city: String,
    state: String, postalCode: String, country: String, phone: String
  },
  billingAddress: {
    name: String, line1: String, line2: String, city: String,
    state: String, postalCode: String, country: String, phone: String
  },
  payment: {
    method: String,
    provider: String,
    transactionId: String,
    status: { type: String, enum: ['pending', 'processing', 'captured', 'failed', 'refunded'] },
    amount: Number
  },
  couponCode: String,
  couponDiscount: Number,
  notes: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  expiresAt: Date,
  completedAt: Date
}, { timestamps: true });

checkoutSchema.index({ checkoutId: 1 });
checkoutSchema.index({ userId: 1, createdAt: -1 });
checkoutSchema.index({ status: 1 });
checkoutSchema.index({ expiresAt: 1 });

export const Checkout = mongoose.model<ICheckout>('Checkout', checkoutSchema);