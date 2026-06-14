import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    title: { type: String },
    description: { type: String },
    amount: { type: Number },
    category: { type: String },
    date: { type: Date },
    paymentMethod: { type: String },
    receipt: { type: String },
    vendor: { type: String },
    notes: { type: String },
    tags: { type: [String] },
    isRecurring: { type: Boolean },
    recurringFrequency: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);

// Query optimization indexes
s.index({ merchantId: 1, date: -1 });
s.index({ merchantId: 1, category: 1, date: -1 });
s.index({ merchantId: 1, storeId: 1, date: -1 });
s.index({ merchantId: 1, isRecurring: 1 });
s.index({ date: -1 });

export const Expense = mongoose.models.Expense || mongoose.model('Expense', s, 'expenses');
