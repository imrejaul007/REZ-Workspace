import mongoose, { Document, Schema } from 'mongoose';

export interface IValidation extends Document {
  validationId: string;
  couponId: string;
  userId: string;
  orderValue: number;
  isValid: boolean;
  discount?: number;
  errorMessage?: string;
  checkedAt: Date;
  createdAt: Date;
}

const validationSchema = new Schema<IValidation>({
  validationId: { type: String, required: true, unique: true },
  couponId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  orderValue: { type: Number, required: true },
  isValid: { type: Boolean, required: true },
  discount: Number,
  errorMessage: String,
  checkedAt: { type: Date, default: Date.now }
}, { timestamps: true });

validationSchema.index({ validationId: 1 });
validationSchema.index({ couponId: 1 });
validationSchema.index({ userId: 1 });
validationSchema.index({ createdAt: -1 });

export const Validation = mongoose.model<IValidation>('Validation', validationSchema);