import mongoose, { Schema, Document, Model } from 'mongoose';
import { DealType, InviteStatus } from '../types/index.js';

export interface IPMPInvite extends Document {
  inviteId: string;
  publisherId: string;
  advertiserId?: string;
  dealType: DealType;
  dealDetails: {
    name: string;
    floorPrice: number;
    currency: string;
    targeting?: {
      geo?: string[];
      deviceTypes?: string[];
      contentCategories?: string[];
    };
    startDate: Date;
    endDate: Date;
  };
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  declinedMessage?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

const TargetingSchema = new Schema({
  geo: { type: [String], default: undefined },
  deviceTypes: { type: [String], default: undefined },
  contentCategories: { type: [String], default: undefined },
}, { _id: false });

const DealDetailsSchema = new Schema({
  name: { type: String, required: true, maxlength: 255 },
  floorPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'USD', maxlength: 3 },
  targeting: { type: TargetingSchema, default: undefined },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { _id: false });

const PMPInviteSchema = new Schema<IPMPInvite>(
  {
    inviteId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publisherId: {
      type: String,
      required: true,
      index: true,
    },
    advertiserId: {
      type: String,
      index: true,
    },
    dealType: {
      type: String,
      required: true,
      enum: ['preferred_deal', 'private_marketplace', 'programmatic_guaranteed'],
      index: true,
    },
    dealDetails: {
      type: DealDetailsSchema,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
    },
    declinedAt: {
      type: Date,
    },
    declinedMessage: {
      type: String,
      maxlength: 1000,
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: 'pmp_invites',
  }
);

// Compound indexes for common queries
PMPInviteSchema.index({ publisherId: 1, status: 1 });
PMPInviteSchema.index({ advertiserId: 1, status: 1 });
PMPInviteSchema.index({ dealType: 1, status: 1 });
PMPInviteSchema.index({ createdAt: -1 });

// TTL index for automatic expiration
PMPInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save hook for validation
PMPInviteSchema.pre('save', function (next) {
  if (this.dealDetails.endDate <= this.dealDetails.startDate) {
    next(new Error('End date must be after start date'));
    return;
  }
  if (this.status === 'pending' && this.expiresAt < new Date()) {
    this.status = 'expired';
  }
  next();
});

// Instance methods
PMPInviteSchema.methods.isExpired = function (): boolean {
  return this.expiresAt < new Date() && this.status === 'pending';
};

PMPInviteSchema.methods.canBeAccepted = function (): boolean {
  return this.status === 'pending' && this.expiresAt > new Date();
};

PMPInviteSchema.methods.canBeDeclined = function (): boolean {
  return this.status === 'pending' && this.expiresAt > new Date();
};

// Static methods
PMPInviteSchema.statics.findByInviteId = function (inviteId: string) {
  return this.findOne({ inviteId });
};

PMPInviteSchema.statics.findByPublisher = function (publisherId: string, status?: InviteStatus) {
  const query: Record<string, unknown> = { publisherId };
  if (status) query['status'] = status;
  return this.find(query).sort({ createdAt: -1 });
};

PMPInviteSchema.statics.findByAdvertiser = function (advertiserId: string, status?: InviteStatus) {
  const query: Record<string, unknown> = { advertiserId };
  if (status) query['status'] = status;
  return this.find(query).sort({ createdAt: -1 });
};

PMPInviteSchema.statics.getMetrics = async function (): Promise<{
  totalInvites: number;
  pendingInvites: number;
  acceptedInvites: number;
  declinedInvites: number;
  expiredInvites: number;
  conversionRate: number;
}> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const counts: Record<string, number> = {
    pending: 0,
    accepted: 0,
    declined: 0,
    expired: 0,
  };

  let totalInvites = 0;
  for (const stat of stats) {
    counts[stat['_id'] as string] = stat['count'] as number;
    totalInvites += stat['count'] as number;
  }

  const conversionRate = totalInvites > 0
    ? ((counts['accepted'] || 0) / totalInvites) * 100
    : 0;

  return {
    totalInvites,
    pendingInvites: counts['pending'] || 0,
    acceptedInvites: counts['accepted'] || 0,
    declinedInvites: counts['declined'] || 0,
    expiredInvites: counts['expired'] || 0,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
};

// Transform for JSON
PMPInviteSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const PMPInvite: Model<IPMPInvite> = mongoose.model<IPMPInvite>('PMPInvite', PMPInviteSchema);