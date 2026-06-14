import mongoose, { Document, Schema } from 'mongoose';

// Plan types
export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

// Billing cycle
export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual'
}

// Organization document interface
export interface IBillingInfo {
  plan: PlanType;
  billingCycle: BillingCycle;
  seatsPurchased: number;
  seatsUsed: number;
  seatsAvailable: number;
  pricePerSeat: number;
  totalAmount: number;
  currency: string;
  nextBillingDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
}

export interface IOrganizationSettings {
  allowGuestSeats: boolean;
  requireApprovalForSeats: boolean;
  defaultSeatRole: string;
  seatExpirationDays: number;
  enforceMfa: boolean;
  ssoEnabled: boolean;
  allowedIpRanges?: string[];
}

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  billing: IBillingInfo;
  settings: IOrganizationSettings;
  seats: mongoose.Types.ObjectId[];
  totalSeats: number;
  activeSeats: number;
  ownerId: string;
  parentOrganizationId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Billing info sub-schema
const billingInfoSchema = new Schema<IBillingInfo>(
  {
    plan: {
      type: String,
      enum: Object.values(PlanType),
      default: PlanType.FREE
    },
    billingCycle: {
      type: String,
      enum: Object.values(BillingCycle),
      default: BillingCycle.MONTHLY
    },
    seatsPurchased: {
      type: Number,
      default: 1
    },
    seatsUsed: {
      type: Number,
      default: 0
    },
    seatsAvailable: {
      type: Number,
      default: 1
    },
    pricePerSeat: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    nextBillingDate: {
      type: Date
    },
    autoRenew: {
      type: Boolean,
      default: true
    },
    paymentMethod: {
      type: String
    },
    lastPaymentDate: {
      type: Date
    },
    lastPaymentAmount: {
      type: Number
    }
  },
  { _id: false }
);

// Settings sub-schema
const organizationSettingsSchema = new Schema<IOrganizationSettings>(
  {
    allowGuestSeats: {
      type: Boolean,
      default: false
    },
    requireApprovalForSeats: {
      type: Boolean,
      default: true
    },
    defaultSeatRole: {
      type: String,
      default: 'member'
    },
    seatExpirationDays: {
      type: Number,
      default: 30
    },
    enforceMfa: {
      type: Boolean,
      default: false
    },
    ssoEnabled: {
      type: Boolean,
      default: false
    },
    allowedIpRanges: [{
      type: String
    }]
  },
  { _id: false }
);

// Organization schema
const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    logo: {
      type: String
    },
    website: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      trim: true
    },
    billing: {
      type: billingInfoSchema,
      default: () => ({})
    },
    settings: {
      type: organizationSettingsSchema,
      default: () => ({})
    },
    seats: [{
      type: Schema.Types.ObjectId,
      ref: 'Seat'
    }],
    totalSeats: {
      type: Number,
      default: 1
    },
    activeSeats: {
      type: Number,
      default: 0
    },
    ownerId: {
      type: String,
      required: true,
      index: true
    },
    parentOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization'
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Indexes
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ 'billing.plan': 1 });

// Pre-save hook to update seat counts
organizationSchema.pre('save', function(next) {
  if (this.seats) {
    this.totalSeats = this.seats.length;
  }
  if (this.billing) {
    this.billing.seatsUsed = this.totalSeats;
    this.billing.seatsAvailable = this.billing.seatsPurchased - this.totalSeats;
  }
  next();
});

// Instance method to check if organization can add seat
organizationSchema.methods.canAddSeat = function(): boolean {
  if (this.billing.plan === PlanType.FREE) {
    return this.billing.seatsUsed < 1;
  }
  return this.billing.seatsUsed < this.billing.seatsPurchased;
};

// Instance method to get seat utilization
organizationSchema.methods.getSeatUtilization = function(): number {
  if (this.billing.seatsPurchased === 0) return 0;
  return (this.billing.seatsUsed / this.billing.seatsPurchased) * 100;
};

// Static method to find by slug
organizationSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug });
};

// Export the model
export const Organization = mongoose.model<IOrganization>('Organization', organizationSchema);