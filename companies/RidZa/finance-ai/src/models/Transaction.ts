import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  transactionId: string;
  tenantId: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  date: Date;
  reference?: string;
  metadata?: Record<string, unknown>;
  analysis?: {
    riskScore: number;
    anomalyDetected: boolean;
    categoryVerified: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  transactionId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['income', 'expense', 'transfer'] },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  description: { type: String },
  date: { type: Date, default: Date.now, index: true },
  reference: { type: String },
  metadata: { type: Schema.Types.Mixed },
  analysis: {
    riskScore: { type: Number, min: 0, max: 100 },
    anomalyDetected: { type: Boolean },
    categoryVerified: { type: Boolean }
  }
}, { timestamps: true });

// Compound indexes
TransactionSchema.index({ tenantId: 1, date: -1 });
TransactionSchema.index({ tenantId: 1, type: 1 });
TransactionSchema.index({ tenantId: 1, category: 1 });
TransactionSchema.index({ tenantId: 1, amount: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
