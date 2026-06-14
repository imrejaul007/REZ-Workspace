import mongoose, { Schema } from 'mongoose';

/**
 * KarmaCampaign — CSR and volunteer engagement campaigns
 *
 * RELATED TYPES: @rez/shared-types/entities/campaign.ts
 *
 * Specialized campaign type for corporate social responsibility initiatives.
 * Tracks volunteer participation, events, and community impact metrics.
 */

const karmaCampaignMetricsSchema = new Schema(
  {
    totalVolunteers: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    totalImpact: { type: Number, default: 0 },
  },
  { _id: false },
);

const schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    merchantId: { type: Schema.Types.Mixed, required: true },
    corporateId: { type: String },
    budget: { type: Number },
    coinPool: { type: Number },
    coinPoolRemaining: { type: Number },
    status: {
      type: String,
      enum: ['draft', 'active', 'depleted', 'expired'],
      default: 'draft',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    eventIds: { type: [Schema.Types.Mixed], default: [] },
    issuedCoins: { type: Number, default: 0 },
    metrics: { type: karmaCampaignMetricsSchema, default: () => ({}) },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'karmacampaigns' },
);

schema.index({ merchantId: 1, status: 1 });
schema.index({ merchantId: 1, startDate: -1 });

export const KarmaCampaign =
  mongoose.models.KarmaCampaign || mongoose.model('KarmaCampaign', schema);
