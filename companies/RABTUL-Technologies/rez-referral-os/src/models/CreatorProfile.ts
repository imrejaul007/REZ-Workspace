import mongoose, { Schema, Types } from 'mongoose';
import { ICreatorProfile, CreatorTier, IPayoutMethod } from '../types/referral';

export interface CreatorProfileDocument extends Omit<ICreatorProfile, '_id'>, mongoose.Document {
  addEarnings(amount: number, type: 'pending' | 'approved' | 'paid'): Promise<void>;
  updateTier(): Promise<void>;
  trackConversion(event: 'scan' | 'click' | 'install' | 'registration' | 'order', value?: number, revenue?: number): Promise<void>;
}

interface CreatorProfileModel extends mongoose.Model<CreatorProfileDocument> {
  generateHandle(baseHandle: string, companyId: string): Promise<string>;
}

const payoutMethodSchema = new Schema<IPayoutMethod>(
  {
    type: {
      type: String,
      required: true,
      enum: ['bank', 'upi', 'wallet'],
    },
    details: {
      type: Schema.Types.Mixed,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const creatorProfileSchema = new Schema<CreatorProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      default: 'rez',
    },
    handle: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
    },
    tier: {
      type: String,
      enum: ['starter', 'pro', 'elite', 'partner', 'ambassador'],
      default: 'starter',
      index: true,
    },
    totalViews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalScans: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalInstalls: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRegistrations: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    approvedEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    payoutEnabled: {
      type: Boolean,
      default: false,
    },
    payoutMethods: [payoutMethodSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound unique indexes
creatorProfileSchema.index({ userId: 1, companyId: 1 }, { unique: true });
creatorProfileSchema.index({ handle: 1, companyId: 1 }, { unique: true });
creatorProfileSchema.index({ tier: 1, totalRevenue: -1 });

// Static method to generate unique handle
creatorProfileSchema.statics.generateHandle = async function (
  baseHandle: string,
  companyId: string
): Promise<string> {
  const normalized = baseHandle.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 30);
  let handle = normalized;
  let suffix = 0;

  while (await this.findOne({ handle, companyId })) {
    suffix++;
    handle = `${normalized}${suffix}`;
    if (suffix > 100) {
      throw new Error('Failed to generate unique handle');
    }
  }

  return handle;
};

// Method to add earnings
creatorProfileSchema.methods.addEarnings = async function (
  amount: number,
  type: 'pending' | 'approved' | 'paid'
): Promise<void> {
  switch (type) {
    case 'pending':
      this.pendingEarnings += amount;
      break;
    case 'approved':
      this.pendingEarnings -= amount;
      this.approvedEarnings += amount;
      break;
    case 'paid':
      this.approvedEarnings -= amount;
      this.paidEarnings += amount;
      break;
  }
  await this.save();
};

// Method to update tier based on performance
creatorProfileSchema.methods.updateTier = async function (): Promise<void> {
  const totalUsers = this.totalRegistrations;

  if (totalUsers >= 50000) {
    this.tier = 'ambassador';
  } else if (totalUsers >= 5000) {
    this.tier = 'partner';
  } else if (totalUsers >= 1000) {
    this.tier = 'elite';
  } else if (totalUsers >= 100) {
    this.tier = 'pro';
  } else {
    this.tier = 'starter';
  }

  await this.save();
};

// Method to track a conversion event
creatorProfileSchema.methods.trackConversion = async function (
  event: 'scan' | 'click' | 'install' | 'registration' | 'order',
  value = 1,
  revenue?: number
): Promise<void> {
  switch (event) {
    case 'scan':
      this.totalScans += value;
      break;
    case 'click':
      this.totalClicks += value;
      break;
    case 'install':
      this.totalInstalls += value;
      break;
    case 'registration':
      this.totalRegistrations += value;
      break;
    case 'order':
      this.totalOrders += value;
      if (revenue) {
        this.totalRevenue += revenue;
      }
      break;
  }
  await this.updateTier();
};

export const CreatorProfile = mongoose.model<CreatorProfileDocument, CreatorProfileModel>('CreatorProfile', creatorProfileSchema);
