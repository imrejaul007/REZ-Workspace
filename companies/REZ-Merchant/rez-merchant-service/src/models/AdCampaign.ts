import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * AdCampaign — Merchant service variant (shared collection with rez-ads-service)
 *
 * CANONICAL TYPES: @rez/shared-types/entities/campaign.ts#IAdCampaign
 *
 * CRIT-001 FIX: Schema alignment with rez-ads-service
 * This model shares the same MongoDB collection ('AdCampaign') with rez-ads-service.
 * Both services must maintain compatible schemas. This merchant-service schema is a SUBSET
 * of the canonical schema defined in rez-ads-service/src/models/AdCampaign.ts.
 *
 * Missing fields in merchant-service that exist in ads-service:
 *   - targetLocation?: { city?: string; radiusKm?: number }
 *   - targetInterests?: string[]
 *   - frequencyCapDays?: number (default: 1, min: 1)
 *   - reviewedBy?: Types.ObjectId
 *   - reviewedAt?: Date
 *
 * NOTE: For new fields or schema changes, update rez-ads-service FIRST (canonical),
 * then mirror changes here. Eventually, this service should import IAdCampaign directly
 * from @rez/shared-types or rez-ads-service (architectural debt: ADR-TBD).
 */

export interface IAdCampaign extends Document {
  _id: Types.ObjectId;
  merchantId: Types.ObjectId;
  storeId: Types.ObjectId;
  title: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaUrl?: string;
  imageUrl: string;
  placement: 'home_banner' | 'explore_feed' | 'store_listing' | 'search_result';
  // Targeting (MED-28 FIX)
  targetSegment: 'all' | 'new' | 'loyal' | 'lapsed' | 'nearby';
  targetLocation?: {
    city?: string;
    radiusKm?: number;
  };
  targetInterests?: string[];
  // Budget
  bidType: 'CPC' | 'CPM';
  bidAmount: number;
  dailyBudget: number;
  totalBudget: number;
  totalSpent: number;
  // Schedule
  startDate: Date;
  endDate?: Date;
  // Frequency cap (MED-29 FIX)
  frequencyCapDays?: number;
  // Status
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'rejected' | 'completed';
  rejectionReason?: string;
  // Metrics
  impressions: number;
  clicks: number;
  ctr: number; // virtual
  // Admin (MED-28 FIX)
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Re-use the same collection as rez-ads-service's AdCampaign model.
// Only define the schema if the model hasn't been registered yet.
const schema = new Schema<IAdCampaign>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    headline: { type: String, required: true, trim: true, maxlength: 90 },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    ctaText: { type: String, required: true, trim: true, maxlength: 30 },
    ctaUrl: {
      type: String,
      trim: true,
      // MED-28 FIX: Add Mongoose validator to prevent malicious URLs
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty/undefined
          // Reject javascript:, data:, and other dangerous protocols
          if (/^(javascript|data|vbscript):/i.test(v)) return false;
          // Require http:// or https://
          return /^https?:\/\/./.test(v);
        },
        message: 'ctaUrl must start with http:// or https:// and cannot use javascript:, data:, or vbscript: protocols',
      },
    },
    imageUrl: { type: String, required: true, trim: true },
    placement: { type: String, enum: ['home_banner', 'explore_feed', 'store_listing', 'search_result'], required: true, index: true },
    targetSegment: { type: String, enum: ['all', 'new', 'loyal', 'lapsed', 'nearby'], default: 'all' },
    targetLocation: {
      city: { type: String, trim: true },
      radiusKm: { type: Number, min: 0 },
    },
    targetInterests: [{ type: String, trim: true }],
    bidType: { type: String, enum: ['CPC', 'CPM'], required: true },
    bidAmount: { type: Number, required: true, min: 0 },
    dailyBudget: { type: Number, required: true, min: 0 },
    totalBudget: { type: Number, required: true, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    frequencyCapDays: {
      type: Number,
      default: 1,
      min: 1,
      // MED-29 FIX: Add frequencyCapDays field (was referenced but missing from model)
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, index: true },
    status: { type: String, enum: ['draft', 'pending_review', 'active', 'paused', 'rejected', 'completed'], default: 'draft', index: true },
    rejectionReason: { type: String, trim: true },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Compound indexes
schema.index({ startDate: 1, endDate: 1 });
schema.index({ merchantId: 1, status: 1 });
schema.index({ status: 1, placement: 1, startDate: 1, endDate: 1 });

// Virtual: click-through rate
schema.virtual('ctr').get(function () {
  if (!this.impressions || this.impressions === 0) return 0;
  return (this.clicks / this.impressions) * 100;
});

// Cast to any to handle mongoose type incompatibilities
export const AdCampaign = mongoose.models.AdCampaign as unknown || mongoose.model<IAdCampaign>('AdCampaign', schema);
