import mongoose, { Schema, Types } from 'mongoose';
import {
  IReferral,
  ReferralType,
  ReferralStatus,
  RewardType,
  ITouchpoint,
} from '../types/referral';

export interface ReferralDocument extends Omit<IReferral, '_id'>, mongoose.Document {
  addTouchpoint(touchpoint: ITouchpoint): Promise<void>;
  updateStatus(status: ReferralStatus): Promise<void>;
}

interface ReferralModel extends mongoose.Model<ReferralDocument> {
  findOrCreate(data: {
    referrerId: Types.ObjectId;
    refereeId: Types.ObjectId;
    referralCodeId: Types.ObjectId;
    type: ReferralType;
    companyId: string;
    campaignId?: Types.ObjectId;
  }): Promise<ReferralDocument>;
}

const touchpointSchema = new Schema<ITouchpoint>(
  {
    source: { type: String, required: true },
    medium: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ip: { type: String },
    deviceId: { type: String },
    userAgent: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false }
);

const referralSchema = new Schema<ReferralDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ['consumer', 'merchant', 'creator'],
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    referrerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    refereeId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    referralCodeId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    firstTouch: {
      source: { type: String },
      timestamp: { type: Date },
    },
    lastTouch: {
      source: { type: String },
      timestamp: { type: Date },
    },
    touchpoints: [touchpointSchema],
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    riskFlags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'clicked', 'registered', 'verified', 'qualified', 'rewarded', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    rewardAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardType: {
      type: String,
      enum: ['coins', 'cashback', 'discount', 'commission'],
    },
    coinType: {
      type: String,
      default: 'referral',
    },
    paidAt: {
      type: Date,
    },
    companyId: {
      type: String,
      required: true,
      default: 'rez',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    qualifiedAt: {
      type: Date,
    },
    rewardedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes
referralSchema.index({ referrerId: 1, status: 1 });
referralSchema.index({ refereeId: 1, status: 1 });
referralSchema.index({ referralCodeId: 1, status: 1 });
referralSchema.index({ companyId: 1, createdAt: -1 });
referralSchema.index({ campaignId: 1, status: 1 });

// Unique constraint for consumer referrals
referralSchema.index(
  { referrerId: 1, refereeId: 1 },
  { unique: true, partialFilterExpression: { type: 'consumer' } }
);

// Method to update touchpoint
referralSchema.methods.addTouchpoint = async function (touchpoint: ITouchpoint): Promise<void> {
  if (!this.firstTouch) {
    this.firstTouch = {
      source: touchpoint.source,
      timestamp: touchpoint.timestamp,
    };
  }
  this.lastTouch = {
    source: touchpoint.source,
    timestamp: touchpoint.timestamp,
  };
  this.touchpoints.push(touchpoint);
  await this.save();
};

// Method to update status
referralSchema.methods.updateStatus = async function (status: ReferralStatus): Promise<void> {
  this.status = status;
  if (status === 'qualified') {
    this.qualifiedAt = new Date();
  } else if (status === 'rewarded') {
    this.rewardedAt = new Date();
  }
  await this.save();
};

// Static method to find or create referral
referralSchema.statics.findOrCreate = async function (data: {
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  referralCodeId: Types.ObjectId;
  type: ReferralType;
  companyId: string;
  campaignId?: Types.ObjectId;
}): Promise<ReferralDocument> {
  let referral = await this.findOne({
    referrerId: data.referrerId,
    refereeId: data.refereeId,
    type: data.type,
  });

  if (!referral) {
    referral = await this.create(data);
  }

  return referral;
};

export const Referral = mongoose.model<ReferralDocument, ReferralModel>('Referral', referralSchema);
