import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    description: { type: String },
    // F-L6 FIX: Enforce canonical Prive tier values to match User.priveTier in backend.
    // Without this enum, arbitrary tier strings can be stored and never match User.priveTier,
    // causing zero users to qualify for any Prive campaign.
    tier: { type: String, enum: ['none', 'entry', 'signature', 'elite'] },
    price: { type: Number },
    benefits: { type: Schema.Types.Mixed },
    duration: { type: Number },
    maxMembers: { type: Number },
    status: { type: String },
    isActive: { type: Boolean },
    features: { type: [Schema.Types.Mixed] },
    terms: { type: String },
    images: { type: [String] },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
export const PriveMembership = mongoose.models.PriveMembership || mongoose.model('PriveMembership', s, 'privememberships');
