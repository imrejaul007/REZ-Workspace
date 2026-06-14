import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  couponId: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  currency?: string;
  status: 'active' | 'inactive' | 'expired' | 'exhausted';
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil: Date;
  applicableCategories?: string[];
  excludedCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
  targetSegments?: string[];
  channel?: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  couponId: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'buy_x_get_y', 'free_shipping'],
    required: true
  },
  value: { type: Number, required: true, min: 0 },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'exhausted'],
    default: 'active'
  },
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  applicableCategories: [String],
  excludedCategories: [String],
  applicableProducts: [String],
  excludedProducts: [String],
  targetSegments: [String],
  channel: [String],
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  createdBy: { type: String, required: true }
}, { timestamps: true });

couponSchema.index({ couponId: 1 });
couponSchema.index({ code: 1 });
couponSchema.index({ status: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);