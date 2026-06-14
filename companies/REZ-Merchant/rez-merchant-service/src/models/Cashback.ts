import mongoose, { Schema } from 'mongoose';

const schema = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    customerId: { type: Schema.Types.Mixed },
    orderId: { type: Schema.Types.Mixed },
    storeId: { type: Schema.Types.Mixed },
    amount: { type: Number },
    type: { type: String, default: 'cashback' },
    description: { type: String },
    percentage: { type: Number },
    minOrderAmount: { type: Number },
    maxAmount: { type: Number },
    validFrom: { type: Date },
    validTo: { type: Date },
    status: { type: String, default: 'pending' },
    approvedAmount: { type: Number },
    rejectionReason: { type: String },
    reviewedAt: { type: Date },
    paidAt: { type: Date },
    paymentMethod: { type: String },
    paymentReference: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'cashbacks' },
);
schema.index({ merchantId: 1, status: 1 });
schema.index({ merchantId: 1, createdAt: -1 });
schema.index({ customerId: 1 });
schema.index({ orderId: 1 });

export const Cashback = mongoose.models.Cashback || mongoose.model('Cashback', schema);
