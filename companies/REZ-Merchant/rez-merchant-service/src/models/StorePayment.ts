import mongoose, { Schema } from 'mongoose';

// Shared collection: storepayments is written by rez-backend; merchant service reads it
// for customer spend analytics via customers.ts.
const s = new Schema(
  {
    storeId: { type: Schema.Types.Mixed, index: true },
    userId: { type: Schema.Types.Mixed },
    amount: { type: Number },
    status: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ storeId: 1, createdAt: -1 });
export const StorePayment = mongoose.models.StorePayment || mongoose.model('StorePayment', s, 'storepayments');
