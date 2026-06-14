/**
 * ReZ Recover - Cart Recovery Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICartRecovery extends Document {
  cartId: string;
  shop: string;
  tenantId: string;
  brandId: string;
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  cartValue: number;
  cartItems: CartItem[];
  status: 'abandoned' | 'recovered' | 'converted' | 'expired';
  recoveryAttempts: RecoveryAttempt[];
  recoveredAt?: Date;
  recoveredVia?: 'email' | 'sms' | 'whatsapp' | 'voice';
  recoveredOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  markRecovered(via: 'email' | 'sms' | 'whatsapp' | 'voice', orderId?: string): Promise<void>;
  addAttempt(attempt: RecoveryAttempt): Promise<void>;
}

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface RecoveryAttempt {
  channel: 'email' | 'sms' | 'whatsapp' | 'voice';
  sentAt: Date;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed';
  messageId?: string;
}

const CartItemSchema = new Schema({
  productId: String,
  variantId: String,
  title: String,
  price: Number,
  quantity: Number,
  image: String,
}, { _id: false });

const RecoveryAttemptSchema = new Schema({
  channel: { type: String, enum: ['email', 'sms', 'whatsapp', 'voice'] },
  sentAt: Date,
  status: { type: String, enum: ['sent', 'delivered', 'opened', 'clicked', 'failed'] },
  messageId: String,
}, { _id: false });

const CartRecoverySchema = new Schema({
  cartId: { type: String, required: true, index: true },
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  customerId: String,
  customerEmail: String,
  customerPhone: String,
  cartValue: { type: Number, default: 0 },
  cartItems: [CartItemSchema],
  status: {
    type: String,
    enum: ['abandoned', 'recovered', 'converted', 'expired'],
    default: 'abandoned',
  },
  recoveryAttempts: [RecoveryAttemptSchema],
  recoveredAt: Date,
  recoveredVia: String,
  recoveredOrderId: String,
}, {
  timestamps: true,
  collection: 'cart_recoveries',
});

// Indexes
CartRecoverySchema.index({ shop: 1, status: 1 });
CartRecoverySchema.index({ tenantId: 1, status: 1 });
CartRecoverySchema.index({ customerEmail: 1 });
CartRecoverySchema.index({ createdAt: 1 });

// Methods
CartRecoverySchema.methods.markRecovered = async function(
  via: 'email' | 'sms' | 'whatsapp' | 'voice',
  orderId?: string
) {
  this.status = orderId ? 'converted' : 'recovered';
  this.recoveredAt = new Date();
  this.recoveredVia = via;
  if (orderId) {
    this.recoveredOrderId = orderId;
  }
  await this.save();
};

CartRecoverySchema.methods.addAttempt = async function(attempt: RecoveryAttempt) {
  this.recoveryAttempts.push(attempt);
  await this.save();
};

export const CartRecovery = mongoose.model<ICartRecovery>('CartRecovery', CartRecoverySchema);
