import mongoose, { Schema } from 'mongoose';

/**
 * CampaignRule — Merchant loyalty and promotion rules
 *
 * CANONICAL TYPES: @rez/shared-types/entities/campaign.ts#IMerchantCampaign
 *
 * Used for loyalty programs, promotional rules, and broadcast campaigns.
 * Supports condition-based triggers, reward types, and audience targeting.
 */

const s = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    name: { type: String },
    title: { type: String },
    description: { type: String },
    type: { type: String, enum: ['loyalty', 'promotion', 'broadcast', 'automation'] },
    status: { type: String, enum: ['draft', 'active', 'paused', 'completed', 'cancelled'], default: 'draft' },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    budget: { type: Number, min: 0 },
    budgetCap: { type: Number, min: 0 },
    targetSegment: {
      minVisits: { type: Number },
      maxVisits: { type: Number },
      tags: { type: [String] },
      tiers: { type: [String] }
    },
    targetAudience: {
      type: { type: String, enum: ['all', 'segment', 'tier', 'tag'] },
      segmentIds: { type: [String] }
    },
    rewardValue: { type: Number },
    rewardType: { type: String, enum: ['points', 'discount', 'cashback', 'coupon', 'free_item'] },
    durationDays: { type: Number },
    source: { type: String },
    conditions: [{
      field: { type: String },
      operator: { type: String },
      value: { type: Schema.Types.Mixed }
    }],
    actions: [{
      type: { type: String },
      params: { type: Schema.Types.Mixed }
    }],
    triggers: [{
      type: { type: String, enum: ['order_complete', 'visit', 'signup', 'birthday', 'inactivity', 'manual'] },
      params: { type: Schema.Types.Mixed }
    }],
    priority: { type: Number, default: 0 },
    cooldownDays: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, storeId: 1 });
s.index({ merchantId: 1, status: 1, isActive: 1 });
export const CampaignRule = mongoose.models.CampaignRule || mongoose.model('CampaignRule', s, 'campaignrules');
