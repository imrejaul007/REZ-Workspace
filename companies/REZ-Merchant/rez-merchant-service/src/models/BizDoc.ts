import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    title: { type: String },
    type: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    description: { type: String },
    category: { type: String },
    tags: { type: [String] },
    expiryDate: { type: Date },
    status: { type: String },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
export const BizDoc = mongoose.models.BizDoc || mongoose.model('BizDoc', s, 'bizdocs');
