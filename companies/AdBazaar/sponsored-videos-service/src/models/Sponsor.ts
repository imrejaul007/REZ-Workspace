import mongoose, { Schema, Document } from 'mongoose';
import { ISponsor } from '../types';

export interface ISponsorDocument extends Omit<ISponsor, '_id'>, Document {}

const SponsorSchema = new Schema<ISponsorDocument>(
  {
    videoId: {
      type: String,
      required: [true, 'Video ID is required'],
      index: true,
    },
    advertiserId: {
      type: String,
      required: [true, 'Advertiser ID is required'],
      index: true,
    },
    placement: {
      type: String,
      required: [true, 'Placement is required'],
      enum: ['pre_roll', 'mid_roll', 'post_roll', 'overlay', 'banner'],
      index: true,
    },
    bid: {
      amount: {
        type: Number,
        required: [true, 'Bid amount is required'],
        min: [0, 'Bid amount cannot be negative'],
      },
      currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP'],
      },
      type: {
        type: String,
        required: [true, 'Bid type is required'],
        enum: ['cpm', 'cpc', 'cpv'],
      },
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'rejected'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for performance
SponsorSchema.index({ videoId: 1, status: 1 });
SponsorSchema.index({ advertiserId: 1, status: 1 });
SponsorSchema.index({ placement: 1, status: 1 });
SponsorSchema.index({ startDate: 1, endDate: 1 });

// Compound indexes
SponsorSchema.index({ videoId: 1, advertiserId: 1 }, { unique: true });

// Virtual for CTR
SponsorSchema.virtual('ctr').get(function () {
  if (this.impressions === 0) return 0;
  return (this.clicks / this.impressions) * 100;
});

// Virtual for effective CPC
SponsorSchema.virtual('effectiveCpc').get(function () {
  if (this.clicks === 0) return 0;
  const totalCost = this.impressions * (this.bid.amount / 1000);
  return totalCost / this.clicks;
});

// Pre-save validation
SponsorSchema.pre('save', function (next) {
  if (this.endDate && this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Method to check if sponsor is active
SponsorSchema.methods.isActive = function (): boolean {
  const now = new Date();
  const isWithinDateRange = (!this.endDate || this.endDate >= now) && this.startDate <= now;
  return this.status === 'active' && isWithinDateRange;
};

// Static method to find active sponsors for a video
SponsorSchema.statics.findActiveByVideo = function (videoId: string) {
  const now = new Date();
  return this.find({
    videoId,
    status: 'active',
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  }).sort({ 'bid.amount': -1 });
};

export const Sponsor = mongoose.model<ISponsorDocument>('Sponsor', SponsorSchema);
export default Sponsor;