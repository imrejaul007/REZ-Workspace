import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['free_item', 'discount'], default: 'free_item' },
    description: { type: String, default: '' },
    discountPercent: { type: Number, default: null },
  },
  { _id: false }
);

const punchCardSchema = new mongoose.Schema(
  {
    merchantId: { type: String, required: true, index: true },
    storeId: { type: String, default: null, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    requiredVisits: { type: Number, required: true, min: 1 },
    reward: { type: rewardSchema, default: () => ({ type: 'free_item', description: '' }) },
    // Legacy flat field kept for backward compat with existing route code
    rewardDescription: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

punchCardSchema.index({ merchantId: 1, storeId: 1 });

export const PunchCard =
  mongoose.models.PunchCard || mongoose.model('PunchCard', punchCardSchema, 'punchcards');
