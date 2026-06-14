import mongoose, { Schema, Document } from 'mongoose';

export enum Country {
  INDIA = 'IN',
  UAE = 'AE'
}

export enum ReferralStatus {
  PENDING = 'pending',
  REGISTERED = 'registered',
  INTERESTED = 'interested',
  VISITED = 'visited',
  QUALIFIED = 'qualified',
  CONVERTED = 'converted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum RewardType {
  CASH = 'cash',
  COINS = 'coins',
  DISCOUNT = 'discount',
  VOUCHER = 'voucher'
}

export enum PayoutTrigger {
  IMMEDIATE = 'immediate',
  ON_VISIT = 'on_visit',
  ON_CONVERSION = 'on_conversion'
}

export interface IReferralReward {
  amount: number;
  currency: string;
  type: RewardType;
  paid: boolean;
  paidAt?: Date;
  transactionId?: string;
}

export interface IRefereeBenefits {
  discountPercent?: number;
  waiverAmount?: number;
  freeItems?: string[];
}

export interface IReferralConversion {
  converted: boolean;
  convertedAt?: Date;
  propertyId?: string;
  dealValue?: number;
  commissionEarned?: number;
}

export interface IReferral extends Document {
  code: string;
  shortCode?: string;
  referrerId: string;
  referrerName?: string;
  referrerPhone?: string;
  refereeId?: string;
  refereeName?: string;
  refereePhone?: string;
  programId?: string;
  programName?: string;
  level?: number;
  source?: 'whatsapp' | 'sms' | 'email' | 'social' | 'qr' | 'link' | 'agent';
  utmSource?: string;
  propertyId?: string;
  brokerId?: string;
  status: ReferralStatus;
  rewards?: {
    referrerEarned?: IReferralReward;
    refereeBenefits?: IRefereeBenefits;
  };
  conversion?: IReferralConversion;
  registeredAt?: Date;
  firstInterestAt?: Date;
  firstVisitAt?: Date;
  qualifiedAt?: Date;
  convertedAt?: Date;
  expiresAt?: Date;
  deletedAt?: Date;
}

export interface IPayoutConfig {
  level: number;
  rewardType: RewardType;
  rewardValue: number;
  currency: string;
  minPropertyValue?: number;
  maxPayout?: number;
  conditions?: string;
}

export interface IReferralProgram extends Document {
  name: string;
  description?: string;
  country: Country | 'BOTH';
  validFrom?: Date;
  validUntil?: Date;
  active: boolean;
  levels: IPayoutConfig[];
  maxLevels: number;
  qualificationCriteria?: {
    minPropertyValue?: number;
    currencies: string[];
    requireSiteVisit: boolean;
    requireRegistration: boolean;
  };
  payoutSettings?: {
    autoPayout: boolean;
    payoutTrigger: PayoutTrigger;
    payoutDelay?: number;
    walletIntegration?: 'rez_wallet' | 'bank' | 'upi' | 'bank_transfer';
  };
  maxReferralsPerUser?: number;
  maxPayoutPerUser?: number;
  maxTotalPayout?: number;
  totalReferrals?: number;
  totalPayout?: number;
  deletedAt?: Date;
}

export interface IReferralEarning extends Document {
  referralId: string;
  userId: string;
  level: number;
  amount: number;
  currency: string;
  source?: 'referral_signup' | 'referral_visit' | 'referral_conversion';
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payoutId?: string;
  paidAt?: Date;
  transactionId?: string;
  validatedAt?: Date;
  validatedBy?: string;
  deletedAt?: Date;
}

// Referral Schema
const ReferralRewardSchema = new Schema({
  amount: Number,
  currency: String,
  type: { type: String, enum: Object.values(RewardType) },
  paid: { type: Boolean, default: false },
  paidAt: Date,
  transactionId: String
}, { _id: false });

const RefereeBenefitsSchema = new Schema({
  discountPercent: Number,
  waiverAmount: Number,
  freeItems: [String]
}, { _id: false });

const ReferralConversionSchema = new Schema({
  converted: { type: Boolean, default: false },
  convertedAt: Date,
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  dealValue: Number,
  commissionEarned: Number
}, { _id: false });

const ReferralSchema = new Schema<IReferral>({
  code: { type: String, required: true, unique: true, index: true },
  shortCode: { type: String, unique: true, sparse: true },
  referrerId: { type: String, required: true, index: true },
  referrerName: String,
  referrerPhone: String,
  refereeId: String,
  refereeName: String,
  refereePhone: String,
  programId: { type: Schema.Types.ObjectId, ref: 'ReferralProgram', index: true },
  programName: String,
  level: { type: Number, default: 1 },
  source: { type: String, enum: ['whatsapp', 'sms', 'email', 'social', 'qr', 'link', 'agent'] },
  utmSource: String,
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
  brokerId: { type: Schema.Types.ObjectId, ref: 'Broker' },
  status: { type: String, enum: Object.values(ReferralStatus), default: ReferralStatus.PENDING, index: true },
  rewards: {
    referrerEarned: { type: ReferralRewardSchema },
    refereeBenefits: { type: RefereeBenefitsSchema }
  },
  conversion: { type: ReferralConversionSchema },
  registeredAt: Date,
  firstInterestAt: Date,
  firstVisitAt: Date,
  qualifiedAt: Date,
  convertedAt: Date,
  expiresAt: Date,
  deletedAt: Date
}, { timestamps: true });

ReferralSchema.index({ refereePhone: 1, programId: 1 });
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ status: 1, createdAt: -1 });

export const Referral = mongoose.model<IReferral>('Referral', ReferralSchema);

// Referral Program Schema
const PayoutConfigSchema = new Schema({
  level: { type: Number, required: true },
  rewardType: { type: String, enum: Object.values(RewardType) },
  rewardValue: Number,
  currency: { type: String, default: 'INR' },
  minPropertyValue: Number,
  maxPayout: Number,
  conditions: String
}, { _id: false });

const QualificationCriteriaSchema = new Schema({
  minPropertyValue: Number,
  currencies: [String],
  requireSiteVisit: { type: Boolean, default: false },
  requireRegistration: { type: Boolean, default: true }
}, { _id: false });

const PayoutSettingsSchema = new Schema({
  autoPayout: { type: Boolean, default: true },
  payoutTrigger: { type: String, enum: Object.values(PayoutTrigger) },
  payoutDelay: Number,
  walletIntegration: { type: String, enum: ['rez_wallet', 'bank', 'upi', 'bank_transfer'] }
}, { _id: false });

const ReferralProgramSchema = new Schema<IReferralProgram>({
  name: { type: String, required: true },
  description: String,
  country: { type: String, enum: ['IN', 'AE', 'BOTH'], default: 'BOTH' },
  validFrom: Date,
  validUntil: Date,
  active: { type: Boolean, default: true },
  levels: [PayoutConfigSchema],
  maxLevels: { type: Number, default: 1 },
  qualificationCriteria: { type: QualificationCriteriaSchema },
  payoutSettings: { type: PayoutSettingsSchema },
  maxReferralsPerUser: Number,
  maxPayoutPerUser: Number,
  maxTotalPayout: Number,
  totalReferrals: { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
  deletedAt: Date
}, { timestamps: true });

export const ReferralProgram = mongoose.model<IReferralProgram>('ReferralProgram', ReferralProgramSchema);

// Referral Earning Schema
const ReferralEarningSchema = new Schema<IReferralEarning>({
  referralId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  level: { type: Number, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  source: { type: String, enum: ['referral_signup', 'referral_visit', 'referral_conversion'] },
  status: { type: String, enum: ['pending', 'approved', 'paid', 'cancelled'], default: 'pending' },
  payoutId: String,
  paidAt: Date,
  transactionId: String,
  validatedAt: Date,
  validatedBy: String,
  deletedAt: Date
}, { timestamps: true });

ReferralEarningSchema.index({ userId: 1, status: 1 });
ReferralEarningSchema.index({ createdAt: -1 });

export const ReferralEarning = mongoose.model<IReferralEarning>('ReferralEarning', ReferralEarningSchema);
