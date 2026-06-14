/**
 * TreasuryOS Data Models
 * MongoDB schemas for cash management, investments, and forecasts
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// CASH MANAGEMENT MODELS
// ============================================

/**
 * Treasury Account - Master account for each business entity
 */
export interface ITreasuryAccount extends Document {
  accountId: string;
  businessId: string;
  businessName: string;
  accountType: 'master' | 'operating' | 'reserve' | 'escrow';
  currency: string;
  balance: number;
  reservedBalance: number;
  availableBalance: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountType?: 'current' | 'savings';
  status: 'active' | 'frozen' | 'closed';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const treasuryAccountSchema = new Schema<ITreasuryAccount>({
  accountId: { type: String, required: true, unique: true, index: true },
  businessId: { type: String, required: true, index: true },
  businessName: { type: String, required: true },
  accountType: {
    type: String,
    enum: ['master', 'operating', 'reserve', 'escrow'],
    required: true
  },
  currency: { type: String, default: 'INR' },
  balance: { type: Number, default: 0 },
  reservedBalance: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  bankName: String,
  bankAccountNumber: String,
  bankAccountType: String,
  status: { type: String, enum: ['active', 'frozen', 'closed'], default: 'active' },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

/**
 * Cash Pool - Groups multiple accounts for consolidated management
 */
export interface ICashPool extends Document {
  poolId: string;
  name: string;
  businessId: string;
  accountIds: string[];
  totalBalance: number;
  currency: string;
  sweepEnabled: boolean;
  sweepRules: ISweepRule[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface ISweepRule {
  sourceAccountType: string;
  targetAccountType: string;
  threshold: number;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  time?: string;
}

const cashPoolSchema = new Schema<ICashPool>({
  poolId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  businessId: { type: String, required: true, index: true },
  accountIds: [{ type: String }],
  totalBalance: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  sweepEnabled: { type: Boolean, default: false },
  sweepRules: [{
    sourceAccountType: String,
    targetAccountType: String,
    threshold: Number,
    amount: Number,
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    time: String
  }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

/**
 * Cash Transaction - All cash movements
 */
export interface ICashTransaction extends Document {
  transactionId: string;
  accountId: string;
  businessId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'sweep' | 'interest' | 'fee' | 'adjustment';
  category: 'inflow' | 'outflow' | 'internal';
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  reference?: string;
  referenceType?: 'invoice' | 'payout' | 'refund' | 'manual';
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const cashTransactionSchema = new Schema<ICashTransaction>({
  transactionId: { type: String, required: true, unique: true, index: true },
  accountId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'sweep', 'interest', 'fee', 'adjustment'],
    required: true
  },
  category: {
    type: String,
    enum: ['inflow', 'outflow', 'internal'],
    required: true
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  reference: String,
  referenceType: String,
  description: String,
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

// ============================================
// INVESTMENT MODELS
// ============================================

/**
 * Investment - Tracks all investments (FDs, mutual funds, etc.)
 */
export interface IInvestment extends Document {
  investmentId: string;
  businessId: string;
  accountId: string;
  type: 'fixed_deposit' | 'recurring_deposit' | 'mutual_fund' | 'government_bond' | 'corporate_bond' | 'money_market' | 'custom';
  name: string;
  provider: string;
  principal: number;
  currentValue: number;
  interestRate: number;
  interestType: 'simple' | 'compound';
  compoundingFrequency?: 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  maturityDate: Date;
  tenureDays: number;
  status: 'active' | 'matured' | 'foreclosed' | 'auto_renewed';
  maturityAmount?: number;
  interestEarned?: number;
  taxWithheld?: number;
  autoRenew: boolean;
  renewTerms?: Record<string, unknown>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const investmentSchema = new Schema<IInvestment>({
  investmentId: { type: String, required: true, unique: true, index: true },
  businessId: { type: String, required: true, index: true },
  accountId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['fixed_deposit', 'recurring_deposit', 'mutual_fund', 'government_bond', 'corporate_bond', 'money_market', 'custom'],
    required: true
  },
  name: { type: String, required: true },
  provider: { type: String, required: true },
  principal: { type: Number, required: true },
  currentValue: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  interestType: { type: String, enum: ['simple', 'compound'], default: 'simple' },
  compoundingFrequency: String,
  startDate: { type: Date, required: true },
  maturityDate: { type: Date, required: true },
  tenureDays: { type: Number, required: true },
  status: {
    type: String,
    enum: ['active', 'matured', 'foreclosed', 'auto_renewed'],
    default: 'active'
  },
  maturityAmount: Number,
  interestEarned: Number,
  taxWithheld: Number,
  autoRenew: { type: Boolean, default: false },
  renewTerms: { type: Schema.Types.Mixed },
  notes: String
}, { timestamps: true });

/**
 * Investment Return Tracking
 */
export interface IInvestmentReturn extends Document {
  returnId: string;
  investmentId: string;
  businessId: string;
  date: Date;
  value: number;
  change: number;
  changePercent: number;
  benchmarkValue?: number;
  benchmarkReturn?: number;
  alpha?: number;
  createdAt: Date;
}

const investmentReturnSchema = new Schema<IInvestmentReturn>({
  returnId: { type: String, required: true, unique: true, index: true },
  investmentId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  value: { type: Number, required: true },
  change: { type: Number, required: true },
  changePercent: { type: Number, required: true },
  benchmarkValue: Number,
  benchmarkReturn: Number,
  alpha: Number
}, { timestamps: true });

/**
 * Investment Transaction
 */
export interface IInvestmentTransaction extends Document {
  transactionId: string;
  investmentId: string;
  businessId: string;
  type: 'purchase' | 'redemption' | 'dividend' | 'interest' | 'fee' | 'reinvestment';
  amount: number;
  units?: number;
  nav?: number;
  tax?: number;
  description?: string;
  createdAt: Date;
}

const investmentTransactionSchema = new Schema<IInvestmentTransaction>({
  transactionId: { type: String, required: true, unique: true, index: true },
  investmentId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['purchase', 'redemption', 'dividend', 'interest', 'fee', 'reinvestment'],
    required: true
  },
  amount: { type: Number, required: true },
  units: Number,
  nav: Number,
  tax: Number,
  description: String
}, { timestamps: true });

// ============================================
// FORECAST MODELS
// ============================================

/**
 * Cash Forecast - Rolling forecast data
 */
export interface ICashForecast extends Document {
  forecastId: string;
  businessId: string;
  weekStartDate: Date;
  weekNumber: number;
  year: number;
  currency: string;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  confidence: number;
  factors: IForecastFactor[];
  status: 'draft' | 'locked' | 'actual';
  actualInflow?: number;
  actualOutflow?: number;
  actualClosingBalance?: number;
  variance?: number;
  variancePercent?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IForecastFactor {
  category: string;
  description: string;
  amount: number;
  probability: number;
  weightedAmount: number;
}

const cashForecastSchema = new Schema<ICashForecast>({
  forecastId: { type: String, required: true, unique: true, index: true },
  businessId: { type: String, required: true, index: true },
  weekStartDate: { type: Date, required: true },
  weekNumber: { type: Number, required: true },
  year: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  projectedInflow: { type: Number, required: true },
  projectedOutflow: { type: Number, required: true },
  netCashFlow: { type: Number, required: true },
  openingBalance: { type: Number, required: true },
  closingBalance: { type: Number, required: true },
  confidence: { type: Number, default: 0.8 },
  factors: [{
    category: String,
    description: String,
    amount: Number,
    probability: Number,
    weightedAmount: Number
  }],
  status: { type: String, enum: ['draft', 'locked', 'actual'], default: 'draft' },
  actualInflow: Number,
  actualOutflow: Number,
  actualClosingBalance: Number,
  variance: Number,
  variancePercent: Number
}, { timestamps: true });

/**
 * Forecast Variance Analysis
 */
export interface IForecastVariance extends Document {
  varianceId: string;
  businessId: string;
  forecastId: string;
  period: Date;
  category: string;
  projected: number;
  actual: number;
  variance: number;
  variancePercent: number;
  reasons: string[];
  createdAt: Date;
}

const forecastVarianceSchema = new Schema<IForecastVariance>({
  varianceId: { type: String, required: true, unique: true, index: true },
  businessId: { type: String, required: true, index: true },
  forecastId: { type: String, required: true, index: true },
  period: { type: Date, required: true },
  category: { type: String, required: true },
  projected: { type: Number, required: true },
  actual: { type: Number, required: true },
  variance: { type: Number, required: true },
  variancePercent: { type: Number, required: true },
  reasons: [{ type: String }]
}, { timestamps: true });

/**
 * Shortfall Alert
 */
export interface IShortfallAlert extends Document {
  alertId: string;
  businessId: string;
  forecastId?: string;
  type: 'imminent' | 'projected' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  projectedShortfall: number;
  shortfallDate: Date;
  projectedBalance: number;
  requiredBalance: number;
  recoveryActions: IRecoveryAction[];
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IRecoveryAction {
  action: string;
  amount?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  dueDate?: Date;
  completedAt?: Date;
}

const shortfallAlertSchema = new Schema<IShortfallAlert>({
  alertId: { type: String, required: true, unique: true, index: true },
  businessId: { type: String, required: true, index: true },
  forecastId: String,
  type: {
    type: String,
    enum: ['imminent', 'projected', 'critical'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  projectedShortfall: { type: Number, required: true },
  shortfallDate: { type: Date, required: true },
  projectedBalance: { type: Number, required: true },
  requiredBalance: { type: Number, required: true },
  recoveryActions: [{
    action: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'rejected'] },
    dueDate: Date,
    completedAt: Date
  }],
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'escalated'],
    default: 'active'
  },
  acknowledgedAt: Date,
  resolvedAt: Date
}, { timestamps: true });

// ============================================
// EXPORT MODELS
// ============================================

export const TreasuryAccount = mongoose.model<ITreasuryAccount>('TreasuryAccount', treasuryAccountSchema);
export const CashPool = mongoose.model<ICashPool>('CashPool', cashPoolSchema);
export const CashTransaction = mongoose.model<ICashTransaction>('CashTransaction', cashTransactionSchema);
export const Investment = mongoose.model<IInvestment>('Investment', investmentSchema);
export const InvestmentReturn = mongoose.model<IInvestmentReturn>('investmentReturnSchema', investmentReturnSchema);
export const InvestmentTransaction = mongoose.model<IInvestmentTransaction>('InvestmentTransaction', investmentTransactionSchema);
export const CashForecast = mongoose.model<ICashForecast>('CashForecast', cashForecastSchema);
export const ForecastVariance = mongoose.model<IForecastVariance>('ForecastVariance', forecastVarianceSchema);
export const ShortfallAlert = mongoose.model<IShortfallAlert>('ShortfallAlert', shortfallAlertSchema);
