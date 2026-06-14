import mongoose, { Document, Schema } from 'mongoose';

// Payment Score Sub-document
export interface IPaymentScore {
  score: number;
  onTimePayments: number;
  latePayments: number;
  defaultedPayments: number;
}

// Fulfillment Score Sub-document
export interface IFulfillmentScore {
  score: number;
  ordersFulfilled: number;
  partial: number;
  failed: number;
}

// Dispute Score Sub-document
export interface IDisputeScore {
  score: number;
  disputesFiled: number;
  won: number;
  lost: number;
}

// Verification Score Sub-document
export interface IVerificationScore {
  score: number;
  kycCompleted: boolean;
  kybCompleted: boolean;
  documentsVerified: number;
}

// Trust Score Main Document
export interface ITrustScore extends Document {
  entityId: string;
  entityType: 'user' | 'merchant' | 'business' | 'partner';
  overallScore: number;
  paymentScore: IPaymentScore;
  fulfillmentScore: IFulfillmentScore;
  disputeScore: IDisputeScore;
  verificationScore: IVerificationScore;
  trustLevel: 'excellent' | 'good' | 'fair' | 'poor';
  history: Array<{
    timestamp: Date;
    overallScore: number;
    paymentScore: number;
    fulfillmentScore: number;
    disputeScore: number;
    verificationScore: number;
    changeReason: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Credit Score Document
export interface ICreditScore extends Document {
  entityId: string;
  score: number;
  creditLimit: number;
  currentUtilization: number;
  availableCredit: number;
  paymentHistory: Array<{
    date: Date;
    amount: number;
    status: 'paid' | 'partial' | 'overdue' | 'defaulted';
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Credit Term
export interface ICreditTerm {
  termDays: number;
  maxAmount: number;
  interestRate: number;
  available: boolean;
}

// Transaction Limit Document
export interface ITransactionLimit extends Document {
  entityId: string;
  maxAutoApprove: number;
  requiresEscrowAbove: number;
  canExtendCredit: boolean;
  creditTermsAvailable: ICreditTerm[];
  dailyLimit: number;
  monthlyLimit: number;
  transactionCountLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

// Trust Score Schema
const PaymentScoreSchema = new Schema<IPaymentScore>(
  {
    score: { type: Number, default: 50, min: 0, max: 100 },
    onTimePayments: { type: Number, default: 0 },
    latePayments: { type: Number, default: 0 },
    defaultedPayments: { type: Number, default: 0 },
  },
  { _id: false }
);

const FulfillmentScoreSchema = new Schema<IFulfillmentScore>(
  {
    score: { type: Number, default: 50, min: 0, max: 100 },
    ordersFulfilled: { type: Number, default: 0 },
    partial: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { _id: false }
);

const DisputeScoreSchema = new Schema<IDisputeScore>(
  {
    score: { type: Number, default: 50, min: 0, max: 100 },
    disputesFiled: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
  },
  { _id: false }
);

const VerificationScoreSchema = new Schema<IVerificationScore>(
  {
    score: { type: Number, default: 50, min: 0, max: 100 },
    kycCompleted: { type: Boolean, default: false },
    kybCompleted: { type: Boolean, default: false },
    documentsVerified: { type: Number, default: 0 },
  },
  { _id: false }
);

const TrustHistorySchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    overallScore: { type: Number, required: true },
    paymentScore: { type: Number, required: true },
    fulfillmentScore: { type: Number, required: true },
    disputeScore: { type: Number, required: true },
    verificationScore: { type: Number, required: true },
    changeReason: { type: String, required: true },
  },
  { _id: false }
);

const TrustScoreSchema = new Schema<ITrustScore>(
  {
    entityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['user', 'merchant', 'business', 'partner'],
      required: true,
    },
    overallScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    paymentScore: {
      type: PaymentScoreSchema,
      default: () => ({}),
    },
    fulfillmentScore: {
      type: FulfillmentScoreSchema,
      default: () => ({}),
    },
    disputeScore: {
      type: DisputeScoreSchema,
      default: () => ({}),
    },
    verificationScore: {
      type: VerificationScoreSchema,
      default: () => ({}),
    },
    trustLevel: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair',
    },
    history: {
      type: [TrustHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Credit Score Schema
const PaymentHistorySchema = new Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['paid', 'partial', 'overdue', 'defaulted'],
      required: true,
    },
  },
  { _id: false }
);

const CreditScoreSchema = new Schema<ICreditScore>(
  {
    entityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    score: {
      type: Number,
      default: 500,
      min: 300,
      max: 900,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    currentUtilization: {
      type: Number,
      default: 0,
    },
    availableCredit: {
      type: Number,
      default: 0,
    },
    paymentHistory: {
      type: [PaymentHistorySchema],
      default: [],
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'very_high'],
      default: 'medium',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Credit Term Schema
const CreditTermSchema = new Schema<ICreditTerm>(
  {
    termDays: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

// Transaction Limit Schema
const TransactionLimitSchema = new Schema<ITransactionLimit>(
  {
    entityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    maxAutoApprove: {
      type: Number,
      default: 10000,
    },
    requiresEscrowAbove: {
      type: Number,
      default: 50000,
    },
    canExtendCredit: {
      type: Boolean,
      default: false,
    },
    creditTermsAvailable: {
      type: [CreditTermSchema],
      default: [],
    },
    dailyLimit: {
      type: Number,
      default: 100000,
    },
    monthlyLimit: {
      type: Number,
      default: 1000000,
    },
    transactionCountLimit: {
      type: Number,
      default: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate trust level based on overall score
TrustScoreSchema.methods.calculateTrustLevel = function (score: number): string {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};

// Calculate risk level based on credit score
CreditScoreSchema.methods.calculateRiskLevel = function (score: number): string {
  if (score >= 750) return 'low';
  if (score >= 650) return 'medium';
  if (score >= 500) return 'high';
  return 'very_high';
};

// Export models
export const TrustScore = mongoose.model<ITrustScore>('TrustScore', TrustScoreSchema);
export const CreditScore = mongoose.model<ICreditScore>('CreditScore', CreditScoreSchema);
export const TransactionLimit = mongoose.model<ITransactionLimit>('TransactionLimit', TransactionLimitSchema);
