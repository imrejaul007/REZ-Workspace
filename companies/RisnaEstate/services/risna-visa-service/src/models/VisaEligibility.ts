import mongoose, { Schema, Document } from 'mongoose';

export enum Country {
  INDIA = 'IN',
  UAE = 'AE'
}

export enum VisaProgramType {
  GOLDEN_VISA = 'golden_visa',
  SILVER_VISA = 'silver_visa',
  INVESTOR_VISA = 'investor_visa',
  RETIREMENT_VISA = 'retirement_visa',
  FREELANCER_VISA = 'freelancer_visa'
}

export enum DocumentStatus {
  PENDING = 'pending',
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum VisaAssessmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface IPropertyInvestment {
  propertyId?: string;
  propertyValue?: number;
  currency?: string;
  ownershipPercentage?: number;
  proofDocument?: string;
}

export interface IEligibilityPoints {
  age?: { required: number; earned: number };
  investment?: { required: number; earned: number };
  language?: { required: number; earned: number };
  experience?: { required: number; earned: number };
  education?: { required: number; earned: number };
}

export interface IVisaCriteria {
  programType: VisaProgramType;
  country: Country;
  minimumInvestment: number;
  currency: string;
  investmentTypes?: string[];
  points?: IEligibilityPoints;
  totalPoints?: number;
  passingPoints?: number;
  passed?: boolean;
}

export interface IVisaDocument {
  id?: string;
  type: string;
  name?: string;
  url?: string;
  status: DocumentStatus;
  uploadedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface IVisaApplication {
  submittedAt?: Date;
  applicationId?: string;
  status?: string;
  lastUpdated?: Date;
  nextStep?: string;
  notes?: string;
}

export interface IVisaAssessment {
  status: VisaAssessmentStatus;
  eligibilityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedApprovalChance: number;
}

export interface IVisaProfile {
  nationality?: string;
  currentVisa?: string;
  age?: number;
  maritalStatus?: string;
  dependents?: number;
  annualIncome?: number;
  incomeCurrency?: string;
  netWorth?: number;
  employmentStatus?: string;
  educationLevel?: string;
}

export interface IVisaEligibility extends Document {
  userId: string;
  email?: string;
  phone?: string;
  country: Country;
  emirates?: string[];
  assessment: IVisaAssessment;
  profile?: IVisaProfile;
  investments?: IPropertyInvestment[];
  totalInvestmentValue?: number;
  criteria?: IVisaCriteria;
  documents?: IVisaDocument[];
  missingDocuments?: string[];
  application?: IVisaApplication;
  assignedAdvisorId?: string;
  visaValidFrom?: Date;
  visaValidUntil?: Date;
  deletedAt?: Date;
}

// Schema definitions
const PropertyInvestmentSchema = new Schema({
  propertyId: String,
  propertyValue: Number,
  currency: String,
  ownershipPercentage: Number,
  proofDocument: String
}, { _id: false });

const EligibilityPointsSchema = new Schema({
  age: { required: Number, earned: Number },
  investment: { required: Number, earned: Number },
  language: { required: Number, earned: Number },
  experience: { required: Number, earned: Number },
  education: { required: Number, earned: Number }
}, { _id: false });

const VisaDocumentSchema = new Schema({
  type: { type: String, required: true },
  name: String,
  url: String,
  status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.PENDING },
  uploadedAt: Date,
  verifiedAt: Date,
  rejectionReason: String
}, { _id: true });

const VisaCriteriaSchema = new Schema({
  programType: { type: String, enum: Object.values(VisaProgramType), required: true },
  country: { type: String, enum: Object.values(Country), required: true },
  minimumInvestment: { type: Number, required: true },
  currency: { type: String, default: 'AED' },
  investmentTypes: [String],
  points: { type: EligibilityPointsSchema },
  totalPoints: Number,
  passingPoints: Number,
  passed: Boolean
}, { _id: false });

const VisaApplicationSchema = new Schema({
  submittedAt: Date,
  applicationId: String,
  status: String,
  lastUpdated: Date,
  nextStep: String,
  notes: String
}, { _id: false });

const VisaAssessmentSchema = new Schema({
  status: { type: String, enum: Object.values(VisaAssessmentStatus), default: VisaAssessmentStatus.NOT_STARTED },
  eligibilityScore: { type: Number, min: 0, max: 100, default: 0 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  estimatedApprovalChance: { type: Number, min: 0, max: 100, default: 0 }
}, { _id: false });

const VisaProfileSchema = new Schema({
  nationality: String,
  currentVisa: String,
  age: Number,
  maritalStatus: String,
  dependents: Number,
  annualIncome: Number,
  incomeCurrency: String,
  netWorth: Number,
  employmentStatus: String,
  educationLevel: String
}, { _id: false });

const VisaEligibilitySchema = new Schema<IVisaEligibility>({
  userId: { type: String, required: true, index: true },
  email: String,
  phone: String,
  country: { type: String, enum: Object.values(Country), required: true },
  emirates: [String],
  assessment: { type: VisaAssessmentSchema, required: true },
  profile: { type: VisaProfileSchema },
  investments: [PropertyInvestmentSchema],
  totalInvestmentValue: Number,
  criteria: { type: VisaCriteriaSchema },
  documents: [VisaDocumentSchema],
  missingDocuments: [String],
  application: { type: VisaApplicationSchema },
  assignedAdvisorId: String,
  visaValidFrom: Date,
  visaValidUntil: Date,
  deletedAt: Date
}, { timestamps: true });

// Indexes
VisaEligibilitySchema.index({ userId: 1, country: 1 });
VisaEligibilitySchema.index({ 'assessment.status': 1 });
VisaEligibilitySchema.index({ 'assessment.eligibilityScore': -1 });
VisaEligibilitySchema.index({ country: 1, 'criteria.programType': 1 });

export const VisaEligibility = mongoose.model<IVisaEligibility>('VisaEligibility', VisaEligibilitySchema);

// UAE Golden Visa Programs (reference data)
export const UAE_VISA_PROGRAMS = {
  [VisaProgramType.GOLDEN_VISA]: {
    name: 'UAE Golden Visa',
    description: '10-year renewable visa for investors, entrepreneurs, specialized talents',
    minimumInvestment: 2000000, // AED
    currency: 'AED',
    investmentTypes: ['property', 'fund', 'business'],
    passingPoints: 100,
    pointsBreakdown: {
      investment: { weight: 40, max: 40 },
      age: { weight: 10, max: 10 },
      language: { weight: 15, max: 15 },
      experience: { weight: 20, max: 20 },
      education: { weight: 15, max: 15 }
    }
  },
  [VisaProgramType.INVESTOR_VISA]: {
    name: 'Investor Visa',
    description: '3-year renewable visa for property investors',
    minimumInvestment: 545000, // AED (for property)
    currency: 'AED',
    investmentTypes: ['property', 'fund'],
    passingPoints: 70,
    pointsBreakdown: {
      investment: { weight: 50, max: 50 },
      age: { weight: 15, max: 15 },
      language: { weight: 20, max: 20 },
      experience: { weight: 15, max: 15 }
    }
  },
  [VisaProgramType.RETIREMENT_VISA]: {
    name: 'Retirement Visa',
    description: '5-year renewable visa for retirees',
    minimumInvestment: 1000000, // AED (property or savings)
    currency: 'AED',
    investmentTypes: ['property', 'savings'],
    passingPoints: 60
  }
};
