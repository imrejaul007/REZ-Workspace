import mongoose, { Document, Schema } from 'mongoose';

export interface IUsage extends Document {
  usageId: string;
  couponId: string;
  userId: string;
  orderId?: string;
  discount: number;
  orderValue: number;
  status: 'applied' | 'reversed' | 'expired';
  appliedAt: Date;
  reversedAt?: Date;
  createdAt: Date;
}

const usageSchema = new Schema<IUsage>({
  usageId: { type: String, required: true, unique: true },
  couponId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  orderId: String,
  discount: { type: Number, required: true },
  orderValue: { type: Number, required: true },
  status: {
    type: String,
    enum: ['applied', 'reversed', 'expired'],
    default: 'applied'
  },
  appliedAt: { type: Date, default: Date.now },
  reversedAt: Date
}, { timestamps: true });

usageSchema.index({ usageId: 1 });
usageSchema.index({ couponId: 1, userId: 1 });
usageSchema.index({ orderId: 1 });
usageSchema.index({ status: 1 });

export const Usage = mongoose.model<IUsage>('Usage', usageSchema);