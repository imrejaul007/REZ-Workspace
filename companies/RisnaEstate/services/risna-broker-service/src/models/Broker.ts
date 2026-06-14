import mongoose, { Schema, Document } from 'mongoose';

export enum Country {
  INDIA = 'IN',
  UAE = 'AE'
}

export enum BrokerLicenseType {
  BROKER = 'broker',
  AGENT = 'agent',
  FRANCHISE = 'franchise'
}

export enum TeamRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  SENIOR_AGENT = 'senior_agent',
  AGENT = 'agent',
  TRAINEE = 'trainee'
}

export enum BrokerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export interface IBrokerLicense {
  number?: string;
  type?: BrokerLicenseType;
  state?: string;
  reraNumber?: string;
  validUntil?: Date;
  verified: boolean;
}

export interface IBrokerCoverage {
  countries: Country[];
  cities: string[];
  localities?: string[];
}

export interface IBrokerStats {
  totalListings: number;
  activeListings: number;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalDeals: number;
  totalVolume: number;
  avgDealSize: number;
  rating: number;
  reviewCount: number;
}

export interface IBrokerCommission {
  defaultRate?: number;
  customRates?: Array<{
    propertyType?: string;
    listingType?: string;
    rate: number;
    minCommission?: number;
  }>;
  splitWithCompany?: number;
}

export interface IBrokerWalletBalance {
  available: number;
  pending: number;
  currency: string;
}

export interface IBrokerVerification {
  documentsSubmitted: boolean;
  documentsVerified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface IBroker extends Document {
  userId: string;
  name: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  profileImage?: string;
  companyName?: string;
  companyLogo?: string;
  dhaLicense?: string;
  license?: IBrokerLicense;
  coverage?: IBrokerCoverage;
  specializations?: string[];
  languages?: string[];
  stats?: IBrokerStats;
  commission?: IBrokerCommission;
  teamId?: string;
  teamRole?: TeamRole;
  agents?: string[];
  uplineBrokerId?: string;
  downlineBrokers?: string[];
  walletBalance?: IBrokerWalletBalance;
  status: BrokerStatus;
  verification?: IBrokerVerification;
  deletedAt?: Date;
}

export interface ITeam extends Document {
  name: string;
  managerId: string;
  parentTeamId?: string;
  coverage?: {
    countries: Country[];
    cities: string[];
  };
  memberCount: number;
  stats?: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    totalVolume: number;
  };
  commissionPool?: {
    total: number;
    distributed: number;
  };
  active: boolean;
  deletedAt?: Date;
}

// Broker Schema
const BrokerLicenseSchema = new Schema({
  number: String,
  type: { type: String, enum: Object.values(BrokerLicenseType) },
  state: String,
  reraNumber: String,
  validUntil: Date,
  verified: { type: Boolean, default: false }
}, { _id: false });

const BrokerCoverageSchema = new Schema({
  countries: [String],
  cities: [String],
  localities: [String]
}, { _id: false });

const BrokerStatsSchema = new Schema({
  totalListings: { type: Number, default: 0 },
  activeListings: { type: Number, default: 0 },
  totalLeads: { type: Number, default: 0 },
  convertedLeads: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  totalDeals: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 },
  avgDealSize: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { _id: false });

const BrokerCommissionSchema = new Schema({
  defaultRate: Number,
  customRates: [{
    propertyType: String,
    listingType: String,
    rate: Number,
    minCommission: Number
  }],
  splitWithCompany: Number
}, { _id: false });

const BrokerWalletBalanceSchema = new Schema({
  available: { type: Number, default: 0 },
  pending: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' }
}, { _id: false });

const BrokerVerificationSchema = new Schema({
  documentsSubmitted: { type: Boolean, default: false },
  documentsVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: String
}, { _id: false });

const BrokerSchema = new Schema<IBroker>({
  userId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  whatsapp: String,
  profileImage: String,
  companyName: String,
  companyLogo: String,
  dhaLicense: String,
  license: { type: BrokerLicenseSchema },
  coverage: { type: BrokerCoverageSchema },
  specializations: [String],
  languages: [String],
  stats: { type: BrokerStatsSchema },
  commission: { type: BrokerCommissionSchema },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  teamRole: { type: String, enum: Object.values(TeamRole) },
  agents: [String],
  uplineBrokerId: { type: Schema.Types.ObjectId, ref: 'Broker' },
  downlineBrokers: [{ type: Schema.Types.ObjectId, ref: 'Broker' }],
  walletBalance: { type: BrokerWalletBalanceSchema },
  status: { type: String, enum: Object.values(BrokerStatus), default: BrokerStatus.PENDING_VERIFICATION },
  verification: { type: BrokerVerificationSchema },
  deletedAt: Date
}, { timestamps: true });

BrokerSchema.index({ status: 1 });
BrokerSchema.index({ 'coverage.countries': 1 });
BrokerSchema.index({ 'stats.rating': -1 });

export const Broker = mongoose.model<IBroker>('Broker', BrokerSchema);

// Team Schema
const TeamStatsSchema = new Schema({
  totalLeads: { type: Number, default: 0 },
  convertedLeads: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 }
}, { _id: false });

const TeamCommissionPoolSchema = new Schema({
  total: { type: Number, default: 0 },
  distributed: { type: Number, default: 0 }
}, { _id: false });

const TeamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  managerId: { type: String, required: true },
  parentTeamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  coverage: {
    countries: [String],
    cities: [String]
  },
  memberCount: { type: Number, default: 0 },
  stats: { type: TeamStatsSchema },
  commissionPool: { type: TeamCommissionPoolSchema },
  active: { type: Boolean, default: true },
  deletedAt: Date
}, { timestamps: true });

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
