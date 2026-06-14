import mongoose, { Document, Schema } from 'mongoose';

export enum MembershipType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  HALF_YEARLY = 'half_yearly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
}

export enum MembershipStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
  PENDING_RENEWAL = 'pending_renewal',
}

export enum MembershipTier {
  BASIC = 'basic',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  VIP = 'vip',
}

export enum RenewalType {
  MANUAL = 'manual',
  AUTO = 'auto',
  CORPORATE = 'corporate',
}

export interface IFamilyMember {
  name: string;
  relationship: string;
  userId?: string;
}

export interface IMembership extends Document {
  membershipId: string;
  userId: string;
  packageId?: string;
  name: string;
  description: string;
  type: MembershipType;
  tier: MembershipTier;
  status: MembershipStatus;
  startDate: Date;
  endDate: Date;
  autoRenewal: boolean;
  renewalType: RenewalType;
  price: number;
  currency: string;
  discount: number;
  benefits: string[];
  visitsRemaining?: number;
  totalVisits?: number;
  familyMembers: IFamilyMember[];
  corporateCode?: string;
  corporateDiscount?: number;
  paymentId?: string;
  salonId: string;
  branchId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const FamilyMemberSchema = new Schema<IFamilyMember>(
  {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    userId: { type: String },
  },
  { _id: false }
);

const MembershipSchema = new Schema<IMembership>(
  {
    membershipId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    packageId: { type: String, index: true },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: Object.values(MembershipType), required: true },
    tier: { type: String, enum: Object.values(MembershipTier), default: MembershipTier.BASIC },
    status: { type: String, enum: Object.values(MembershipStatus), default: MembershipStatus.ACTIVE, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    autoRenewal: { type: Boolean, default: false },
    renewalType: { type: String, enum: Object.values(RenewalType), default: RenewalType.MANUAL },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    benefits: { type: [String], default: [] },
    visitsRemaining: { type: Number, min: 0 },
    totalVisits: { type: Number, min: 0 },
    familyMembers: { type: [FamilyMemberSchema], default: [] },
    corporateCode: { type: String },
    corporateDiscount: { type: Number, min: 0, max: 100 },
    paymentId: { type: String },
    salonId: { type: String, required: true, index: true },
    branchId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
MembershipSchema.index({ userId: 1, status: 1 });
MembershipSchema.index({ endDate: 1, status: 1 });
MembershipSchema.index({ autoRenewal: 1, status: 1 });
MembershipSchema.index({ corporateCode: 1 });
MembershipSchema.index({ salonId: 1, tier: 1 });

// Virtual for checking if membership is expired
MembershipSchema.virtual('isExpired').get(function () {
  return new Date() > this.endDate;
});

// Update status if expired
MembershipSchema.pre('find', function () {
  this.where({ status: MembershipStatus.ACTIVE, endDate: { $lt: new Date() } }).set({
    $set: { status: MembershipStatus.EXPIRED },
  });
});

export const Membership = mongoose.model<IMembership>('Membership', MembershipSchema);
