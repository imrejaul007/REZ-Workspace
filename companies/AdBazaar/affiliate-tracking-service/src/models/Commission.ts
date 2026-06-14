import mongoose, { Schema, Document } from 'mongoose';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export interface ICommission extends Document {
  commissionId: string;
  affiliateId: string;
  conversionIds: string[];
  totalRevenue: number;
  commissionAmount: number;
  currency: string;
  status: CommissionStatus;
  calculationDetails: {
    cpaCount: number;
    cpaRate: number;
    revShareAmount: number;
    revSharePercent: number;
  };
  period: {
    start: Date;
    end: Date;
  };
  paidAt?: Date;
  paidTransactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>(
  {
    commissionId: { type: String, required: true, unique: true, index: true },
    affiliateId: { type: String, required: true, index: true },
    conversionIds: [{ type: String }],
    totalRevenue: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
    calculationDetails: {
      cpaCount: { type: Number, default: 0 },
      cpaRate: { type: Number, default: 0 },
      revShareAmount: { type: Number, default: 0 },
      revSharePercent: { type: Number, default: 0 },
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    paidAt: { type: Date },
    paidTransactionId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// Indexes
CommissionSchema.index({ affiliateId: 1, status: 1 });
CommissionSchema.index({ period: 1 });
CommissionSchema.index({ status: 1, createdAt: -1 });

export const Commission = mongoose.model<ICommission>('Commission', CommissionSchema);