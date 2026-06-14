import mongoose, { Document, Schema } from 'mongoose';

export interface ICart extends Document {
  cartId: string;
  userId: string;
  sessionId?: string;
  channel: 'web' | 'mobile' | 'app' | 'pos';
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
  }>;
  subtotal: number;
  total: number;
  currency: string;
  status: 'active' | 'abandoned' | 'recovered' | 'converted' | 'expired';
  abandonedAt?: Date;
  recoveredAt?: Date;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  imageUrl: String,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const cartSchema = new Schema<ICart>({
  cartId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, index: true },
  channel: {
    type: String,
    enum: ['web', 'mobile', 'app', 'pos'],
    default: 'web'
  },
  items: [cartItemSchema],
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['active', 'abandoned', 'recovered', 'converted', 'expired'],
    default: 'active'
  },
  abandonedAt: Date,
  recoveredAt: Date,
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

cartSchema.index({ cartId: 1 });
cartSchema.index({ userId: 1, status: 1 });
cartSchema.index({ status: 1, abandonedAt: -1 });
cartSchema.index({ lastActivityAt: -1 });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);