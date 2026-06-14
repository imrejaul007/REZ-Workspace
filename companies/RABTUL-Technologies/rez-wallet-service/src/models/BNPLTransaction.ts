import mongoose, { Schema, Document } from 'mongoose';

// TODO: Migrate to import from '@rez/shared-types'
// Example: import { IBNPLTransaction } from '@rez/shared-types/entities/payment';

export interface IBNPLTransaction extends Document {
  userId: string;
  phone: string;

  amount: number;
  merchantId: string;
  merchantName: string;
  vertical: 'hotel' | 'restaurant' | 'fashion' | 'pharmacy' | 'retail' | 'd2c';

  creditUsed: number;
  interestAmount: number;
  totalDue: number;

  dueDate: Date;
  repaidDate?: Date;
  status: 'ACTIVE' | 'REPAID' | 'DEFAULTED' | 'CANCELLED';

  daysOverdue: number;
  penaltyApplied: number;

  orderId?: string;
  paymentMethod: 'bnpl';

  createdAt: Date;
  updatedAt: Date;
}

const bnplTransactionSchema = new Schema<IBNPLTransaction>({
  userId: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },

  amount: { type: Number, required: true },
  merchantId: { type: String, required: true, index: true },
  merchantName: String,
  vertical: {
    type: String,
    enum: ['hotel', 'restaurant', 'fashion', 'pharmacy', 'retail', 'd2c'],
    required: true
  },

  creditUsed: { type: Number, required: true },
  interestAmount: { type: Number, default: 0 },
  totalDue: { type: Number, required: true },

  dueDate: { type: Date, required: true, index: true },
  repaidDate: Date,
  status: {
    type: String,
    enum: ['ACTIVE', 'REPAID', 'DEFAULTED', 'CANCELLED'],
    default: 'ACTIVE',
    index: true
  },

  daysOverdue: { type: Number, default: 0 },
  penaltyApplied: { type: Number, default: 0 },

  orderId: String,
  paymentMethod: { type: String, default: 'bnpl' },
}, { timestamps: true });

bnplTransactionSchema.index({ userId: 1, status: 1 });
bnplTransactionSchema.index({ dueDate: 1, status: 1 });

export const BNPLTransaction = mongoose.model<IBNPLTransaction>('BNPLTransaction', bnplTransactionSchema);
