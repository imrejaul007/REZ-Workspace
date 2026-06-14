import mongoose, { Schema, Types } from 'mongoose';

export interface IReferralReward {
  _id: Types.ObjectId;
  referralId: Types.ObjectId;
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  type: 'coins' | 'cashback' | 'discount' | 'commission';
  amount: number;
  coinType?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'reversed';
  source: 'referral' | 'ambassador_bonus' | 'team_bonus' | 'campaign';
  campaignId?: Types.ObjectId;
  companyId: string;
  processedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferralRewardDocument extends IReferralReward, mongoose.Document {
  approve(): Promise<void>;
  reject(reason: string): Promise<void>;
  reverse(): Promise<void>;
}

interface ReferralRewardModel extends mongoose.Model<ReferralRewardDocument> {
  findOrCreate(data: {
    referralId: Types.ObjectId;
    referrerId: Types.ObjectId;
    refereeId: Types.ObjectId;
    type: 'coins' | 'cashback' | 'discount' | 'commission';
    amount: number;
    coinType?: string;
    source: 'referral' | 'ambassador_bonus' | 'team_bonus' | 'campaign';
    campaignId?: Types.ObjectId;
    companyId: string;
    idempotencyKey?: string;
  }): Promise<{ reward?: ReferralRewardDocument; created: boolean; existing?: ReferralRewardDocument }>;
}

const referralRewardSchema = new Schema<ReferralRewardDocument>(
  {
    referralId: {
      type: Schema.Types.ObjectId,
      required: true,
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
    type: {
      type: String,
      required: true,
      enum: ['coins', 'cashback', 'discount', 'commission'],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    coinType: {
      type: String,
      default: 'referral',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'paid', 'rejected', 'reversed'],
      default: 'pending',
      index: true,
    },
    source: {
      type: String,
      required: true,
      enum: ['referral', 'ambassador_bonus', 'team_bonus', 'campaign'],
      default: 'referral',
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      default: 'rez',
    },
    processedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Indexes
referralRewardSchema.index({ referrerId: 1, status: 1 });
referralRewardSchema.index({ referralId: 1 });
referralRewardSchema.index({ companyId: 1, status: 1, createdAt: -1 });
referralRewardSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// Compound index for idempotency
referralRewardSchema.index(
  { referralId: 1, type: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);

// Static method to find or create reward with idempotency
referralRewardSchema.statics.findOrCreate = async function (data: {
  referralId: Types.ObjectId;
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  type: 'coins' | 'cashback' | 'discount' | 'commission';
  amount: number;
  coinType?: string;
  source: 'referral' | 'ambassador_bonus' | 'team_bonus' | 'campaign';
  campaignId?: Types.ObjectId;
  companyId: string;
  idempotencyKey?: string;
}): Promise<{ reward?: ReferralRewardDocument; created: boolean; existing?: ReferralRewardDocument }> {
  // Check for existing reward
  if (data.idempotencyKey) {
    const existing = await this.findOne({ idempotencyKey: data.idempotencyKey });
    if (existing) {
      return { existing, created: false };
    }
  }

  // Check for existing reward of same type for same referral
  const existing = await this.findOne({ referralId: data.referralId, type: data.type });
  if (existing) {
    return { existing, created: false };
  }

  const reward = await this.create(data);
  return { reward, created: true };
}

// Method to approve reward
referralRewardSchema.methods.approve = async function (): Promise<void> {
  this.status = 'approved';
  this.processedAt = new Date();
  await this.save();
};

// Method to reject reward
referralRewardSchema.methods.reject = async function (reason: string): Promise<void> {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  await this.save();
};

// Method to reverse reward
referralRewardSchema.methods.reverse = async function (): Promise<void> {
  this.status = 'reversed';
  await this.save();
};

export const ReferralReward = mongoose.model<ReferralRewardDocument, ReferralRewardModel>('ReferralReward', referralRewardSchema);
