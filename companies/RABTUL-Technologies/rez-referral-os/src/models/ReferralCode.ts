import mongoose, { Schema, Types } from 'mongoose';
import { IReferralCode, ReferralType, AmbassadorTier } from '../types/referral';

export interface ReferralCodeDocument extends Omit<IReferralCode, '_id'>, mongoose.Document {
  incrementReferrals(qualified?: boolean): Promise<void>;
  addEarnings(amount: number): Promise<void>;
}

interface ReferralCodeModel extends mongoose.Model<ReferralCodeDocument> {
  generateCode(type: ReferralType): Promise<string>;
}

const referralCodeSchema = new Schema<ReferralCodeDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 6,
      maxlength: 12,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['consumer', 'merchant', 'creator'],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    ownerType: {
      type: String,
      required: true,
      enum: ['user', 'merchant', 'creator'],
    },
    companyId: {
      type: String,
      required: true,
      default: 'rez',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    },
    totalReferrals: {
      type: Number,
      default: 0,
      min: 0,
    },
    qualifiedReferrals: {
      type: Number,
      default: 0,
      min: 0,
    },
    lifetimeEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    trustScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
referralCodeSchema.index({ ownerId: 1, type: 1 });
referralCodeSchema.index({ companyId: 1, type: 1 });
referralCodeSchema.index({ tier: 1, totalReferrals: -1 });

// Static method to generate unique code
referralCodeSchema.statics.generateCode = async function (type: ReferralType): Promise<string> {
  const generateSegment = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
      result += chars[array[0] % chars.length];
      crypto.getRandomValues(array);
    }
    return result;
  };

  let code: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    code = generateSegment();
    const existing = await this.findOne({ code });
    if (!existing) break;
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique referral code');
  }

  return code;
};

// Method to increment referral stats
referralCodeSchema.methods.incrementReferrals = async function (qualified = false): Promise<void> {
  this.totalReferrals += 1;
  if (qualified) {
    this.qualifiedReferrals += 1;
  }
  await this.save();
};

// Method to add earnings
referralCodeSchema.methods.addEarnings = async function (amount: number): Promise<void> {
  this.lifetimeEarnings += amount;
  await this.save();
};

export const ReferralCode = mongoose.model<ReferralCodeDocument, ReferralCodeModel>('ReferralCode', referralCodeSchema);
