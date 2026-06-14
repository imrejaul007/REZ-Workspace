import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    type: { type: String },
    provider: { type: String },
    config: { type: Schema.Types.Mixed },
    webhookUrl: { type: String },
    isActive: { type: Boolean },
    credentials: { type: Schema.Types.Mixed },
    settings: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
export const Integration = mongoose.models.Integration || mongoose.model('Integration', s, 'integrations');
