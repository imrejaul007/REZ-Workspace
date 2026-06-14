import mongoose, { Document, Schema } from 'mongoose';

export interface ICredit extends Document {
  creditId: string;
  referralId: string;
  referrerId: string;
  companyId: string;
  amount: number;
  type: 'points' | 'cash' | 'credit' | 'discount';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
  triggeredBy: 'signup' | 'first_purchase' | 'subscription' | 'milestone';
  transactionId?: string;
  processedAt?: Date;
  reversedAt?: Date;
  reversedReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const CreditSchema = new Schema<ICredit>(
  {
    creditId: { type: String, required: true, unique: true, index: true },
    referralId: { type: String, required: true, index: true },
    referrerId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['points', 'cash', 'credit', 'discount'], required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'reversed'], default: 'pending' },
    triggeredBy: { type: String, enum: ['signup', 'first_purchase', 'subscription', 'milestone'], required: true },
    transactionId: { type: String },
    processedAt: { type: Date },
    reversedAt: { type: Date },
    reversedReason: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

CreditSchema.index({ referralId: 1 });
CreditSchema.index({ referrerId: 1, status: 1 });
CreditSchema.index({ companyId: 1, status: 1 });

export const Credit = mongoose.model<ICredit>('Credit', CreditSchema);