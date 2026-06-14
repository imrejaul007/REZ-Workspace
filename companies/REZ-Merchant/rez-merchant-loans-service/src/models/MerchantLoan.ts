import mongoose, { Schema, Document } from 'mongoose';

export type LoanStatus = 'pending' | 'underwriting' | 'approved' | 'rejected' | 'disbursed' | 'active' | 'repaid' | 'defaulted';
export type LoanPurpose = 'inventory' | 'equipment' | 'marketing' | 'expansion' | 'payroll' | 'emergency';
export type RepaymentCycle = 'daily' | 'weekly' | 'monthly';

export interface IMerchantLoan extends Document {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  businessId: string;
  loanAmount: number;
  purpose: LoanPurpose;
  tenure: number; // months
  interestRate: number; // APR
  processingFee: number;
  repaymentCycle: RepaymentCycle;
  status: LoanStatus;
  riskScore: number; // 0-100
  riskRating: 'low' | 'medium' | 'high' | 'very_high';
  businessType: string;
  monthlyRevenue: number;
  yearsInBusiness: number;
  employees: number;
  documents: IDocument[];
  bankAccount: IBankAccount;
  eligibilityScore: number;
  maxEligibility: number;
  approvedAmount?: number;
  disbursedAmount?: number;
  disbursedAt?: Date;
  repayments: IRepayment[];
  outstandingAmount: number;
  nextRepaymentDate?: Date;
  missedPayments: number;
  appliedAt: Date;
  approvedAt?: Date;
  completedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument {
  type: 'gst' | 'pan' | 'bank_statement' | 'shop_license' | 'address_proof';
  url: string;
  verified: boolean;
  verifiedAt?: Date;
}

export interface IBankAccount {
  accountNumber: string;
  ifsc: string;
  bankName: string;
  accountHolder: string;
  verified: boolean;
}

export interface IRepayment {
  dueDate: Date;
  amount: number;
  principal: number;
  interest: number;
  status: 'pending' | 'paid' | 'missed' | 'partial';
  paidAt?: Date;
  transactionId?: string;
  amountPaid?: number;
}

const DocumentSchema = new Schema({
  type: { type: String, required: true },
  url: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedAt: Date
}, { _id: false });

const BankAccountSchema = new Schema({
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  bankName: { type: String, required: true },
  accountHolder: { type: String, required: true },
  verified: { type: Boolean, default: false }
}, { _id: false });

const RepaymentSchema = new Schema({
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  principal: { type: Number, required: true },
  interest: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'missed', 'partial'], default: 'pending' },
  paidAt: Date,
  transactionId: String,
  amountPaid: Number
}, { _id: false });

const MerchantLoanSchema = new Schema({
  merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  businessId: { type: String, required: true },
  loanAmount: { type: Number, required: true, min: 10000, max: 5000000 },
  purpose: {
    type: String,
    enum: ['inventory', 'equipment', 'marketing', 'expansion', 'payroll', 'emergency'],
    required: true
  },
  tenure: { type: Number, required: true, min: 1, max: 36 },
  interestRate: { type: Number, required: true },
  processingFee: { type: Number, default: 0 },
  repaymentCycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  status: {
    type: String,
    enum: ['pending', 'underwriting', 'approved', 'rejected', 'disbursed', 'active', 'repaid', 'defaulted'],
    default: 'pending',
    index: true
  },
  riskScore: { type: Number, min: 0, max: 100 },
  riskRating: {
    type: String,
    enum: ['low', 'medium', 'high', 'very_high'],
    default: 'medium'
  },
  businessType: { type: String, required: true },
  monthlyRevenue: { type: Number, required: true },
  yearsInBusiness: { type: Number, required: true },
  employees: { type: Number, default: 1 },
  documents: [DocumentSchema],
  bankAccount: BankAccountSchema,
  eligibilityScore: { type: Number, min: 0, max: 100 },
  maxEligibility: { type: Number, default: 0 },
  approvedAmount: Number,
  disbursedAmount: Number,
  disbursedAt: Date,
  repayments: [RepaymentSchema],
  outstandingAmount: { type: Number, default: 0 },
  nextRepaymentDate: Date,
  missedPayments: { type: Number, default: 0 },
  appliedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  completedAt: Date,
  rejectionReason: String
}, { timestamps: true });

MerchantLoanSchema.index({ merchantId: 1, status: 1 });
MerchantLoanSchema.index({ nextRepaymentDate: 1, status: 1 });
MerchantLoanSchema.index({ status: 1, riskRating: 1 });

export const MerchantLoan = mongoose.models.MerchantLoan ||
  mongoose.model<IMerchantLoan>('MerchantLoan', MerchantLoanSchema);
