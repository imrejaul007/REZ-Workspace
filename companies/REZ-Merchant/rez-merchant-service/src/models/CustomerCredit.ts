import mongoose, { Schema, Types } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    customerPhone: { type: String, required: true },
    customerName: { type: String },
    balance: { type: Number, default: 0, min: 0 },
    transactions: [{
      type: { type: String, enum: ['credit', 'debit', 'payment'] },
      amount: { type: Number, required: true },
      description: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],
    lastActivityAt: { type: Date },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, customerPhone: 1 });
s.index({ merchantId: 1, storeId: 1 });
export const CustomerCredit = mongoose.models.CustomerCredit || mongoose.model('CustomerCredit', s, 'customercredits');
