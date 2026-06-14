import mongoose, { Schema, Document } from 'mongoose';

export type PartnerType = 'agency' | 'publisher' | 'reseller' | 'technology' | 'influencer';
export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type PartnerStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';

export interface IPartner extends Document {
  partnerId: string;
  userId: string;
  type: PartnerType;
  tier: PartnerTier;
  companyDetails: {
    name: string;
    legalName?: string;
    website?: string;
    industry: string;
    employeeCount?: string;
    annualRevenue?: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
    designation: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  taxInfo: {
    gstin?: string;
    pan?: string;
    tan?: string;
  };
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    ifscCode: string;
    upiId?: string;
  };
  status: PartnerStatus;
  onboardingProgress: {
    step: number;
    completedSteps: string[];
    currentStep: string;
  };
  agreement: {
    signed: boolean;
    signedAt?: Date;
    documentUrl?: string;
  };
  referralCode?: string;
  referredBy?: string;
  stats: {
    totalRevenue: number;
    totalClients: number;
    activeCampaigns: number;
    joinedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema = new Schema<IPartner>(
  {
    partnerId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['agency', 'publisher', 'reseller', 'technology', 'influencer'],
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
      index: true,
    },
    companyDetails: {
      name: { type: String, required: true },
      legalName: { type: String },
      website: { type: String },
      industry: { type: String, required: true },
      employeeCount: { type: String },
      annualRevenue: { type: String },
    },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
      designation: { type: String, required: true },
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'India' },
      pincode: { type: String, required: true },
    },
    taxInfo: {
      gstin: { type: String },
      pan: { type: String },
      tan: { type: String },
    },
    bankDetails: {
      accountHolder: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      branch: { type: String, required: true },
      ifscCode: { type: String, required: true },
      upiId: { type: String },
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    onboardingProgress: {
      step: { type: Number, default: 1 },
      completedSteps: [{ type: String }],
      currentStep: { type: String, default: 'basic_info' },
    },
    agreement: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date },
      documentUrl: { type: String },
    },
    referralCode: { type: String, index: true },
    referredBy: { type: String },
    stats: {
      totalRevenue: { type: Number, default: 0 },
      totalClients: { type: Number, default: 0 },
      activeCampaigns: { type: Number, default: 0 },
      joinedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

// Indexes
PartnerSchema.index({ status: 1, type: 1 });
PartnerSchema.index({ 'contact.email': 1 });
PartnerSchema.index({ 'taxInfo.gstin': 1 });

export const Partner = mongoose.model<IPartner>('Partner', PartnerSchema);