import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    productId: { type: Schema.Types.Mixed },
    productName: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    reason: { type: String },
    cost: { type: Number },
    date: { type: Date },
    category: { type: String },
    notes: { type: String },
    reportedBy: { type: Schema.Types.Mixed },
    status: { type: String },
    images: { type: [String] },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1, date: -1 });
export const WasteLog = mongoose.models.WasteLog || mongoose.model('WasteLog', s, 'wastelogs');
