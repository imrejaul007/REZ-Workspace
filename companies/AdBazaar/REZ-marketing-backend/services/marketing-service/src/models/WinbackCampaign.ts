import { Schema, model, Document, Types } from 'mongoose';

/**
 * WinbackCampaign — Track win-back campaigns for lapsed customers.
 *
 * Segments users by inactivity period:
 *   - lapsed30: 30 days since last order
 *   - lapsed60: 60 days since last order
 *   - lapsed90: 90+ days since last order
 *
 * Each campaign creates personalized offers with tiered discounts.
 */

export type WinbackSegment = 'lapsed30' | 'lapsed60' | 'lapsed90';
export type WinbackStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
export type WinbackChannel = 'whatsapp' | 'push' | 'sms' | 'email' | 'in_app';

export interface IWinbackStats {
  sent: number;
  delivered: number;
  failed: number;
  offersCreated: number;
  offersRedeemed: number;
  converted: number;
  revenue: number;
}

export interface IWinbackCampaign extends Document {
  merchantId: Types.ObjectId;
  name: string;
  segment: WinbackSegment;
  status: WinbackStatus;
  channel: WinbackChannel;

  // Offer configuration
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  validForDays: number;

  // Audience targeting
  targetUserIds: Types.ObjectId[];

  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;

  // Stats
  stats: IWinbackStats;

  // References
  voucherIds: Types.ObjectId[];
  offerIds: Types.ObjectId[];

  // Tracking
  errorMessage?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WinbackStatsSchema = new Schema<IWinbackStats>(
  {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    offersCreated: { type: Number, default: 0 },
    offersRedeemed: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  { _id: false },
);

const WinbackCampaignSchema = new Schema<IWinbackCampaign>(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    segment: {
      type: String,
      enum: ['lapsed30', 'lapsed60', 'lapsed90'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'push', 'sms', 'email', 'in_app'],
      default: 'whatsapp',
    },

    // Offer configuration
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: { type: Number, required: true, min: 1 },
    minOrderValue: { type: Number, default: 0 },
    validForDays: { type: Number, default: 7 },

    // Audience
    targetUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    voucherIds: [{ type: Schema.Types.ObjectId, ref: 'Voucher' }],
    offerIds: [{ type: Schema.Types.ObjectId }],

    // Scheduling
    scheduledAt: Date,
    sentAt: Date,

    // Stats
    stats: { type: WinbackStatsSchema, default: () => ({}) },
    errorMessage: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
  },
  { timestamps: true },
);

// Indexes for common queries
WinbackCampaignSchema.index({ merchantId: 1, status: 1, createdAt: -1 });
WinbackCampaignSchema.index({ merchantId: 1, segment: 1 });
WinbackCampaignSchema.index({ status: 1, scheduledAt: 1 });

export const WinbackCampaign = model<IWinbackCampaign>('WinbackCampaign', WinbackCampaignSchema);
export default WinbackCampaign;
