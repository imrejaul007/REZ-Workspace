import mongoose, { Schema } from 'mongoose';

/**
 * Broadcast — Broadcast messages from merchants
 *
 * RELATED TYPES: @rez/shared-types/entities/campaign.ts#IMarketingCampaign
 *
 * Used for sending broadcast messages to customers via multiple channels.
 * Includes scheduling, templating, and audience targeting capabilities.
 */

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    title: { type: String },
    message: { type: String },
    type: { type: String },
    channel: { type: String },
    targetAudience: { type: Schema.Types.Mixed },
    scheduledAt: { type: Date },
    status: { type: String },
    template: { type: Schema.Types.Mixed },
    imageUrl: { type: String },
    actionUrl: { type: String },
    tags: { type: [String] },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, createdAt: -1 });
export const Broadcast = mongoose.models.Broadcast || mongoose.model('Broadcast', s, 'broadcasts');
