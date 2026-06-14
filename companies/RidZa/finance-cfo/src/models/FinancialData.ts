/**
 * MongoDB Model for CFO Financial Data
 * Stores cashflow, expenses, revenue, and runway data
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction {
  date: Date;
  type: 'revenue' | 'expense' | 'investment' | 'financing';
  category: string;
  amount: number;
  description: string;
  reference?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface IBurnRate {
  grossBurn: number;
  netBurn: number;
  fixedCosts: number;
  variableCosts: number;
  averageMonthlyBurn: number;
  burnRateTrend: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
}

export interface IRunway {
  currentCash: number;
  monthlyBurn: number;
  monthsRemaining: number;
  projectedDepletionDate: Date;
  runwayStatus: 'healthy' | 'warning' | 'critical';
  confidence: number;
}

export interface ICashflowForecast {
  period: string;
  projectedRevenue: number;
  projectedExpenses: number;
  netCashflow: number;
  endingBalance: number;
}

export interface IFinancialAlert {
  type: 'cash_warning' | 'burn_rate' | 'runway_low' | 'revenue_decline' | 'expense_spike';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value?: number;
  threshold?: number;
  recommendation: string;
  createdAt: Date;
}

export interface IFinancialData extends Document {
  tenantId: string;
  currentCash: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  transactions: ITransaction[];
  burnRate: IBurnRate;
  runway: IRunway;
  forecasts: ICashflowForecast[];
  alerts: IFinancialAlert[];
  lastUpdated: Date;
  metadata: {
    currency: string;
    fiscalYearStart: Date;
    industry?: string;
  };
}

const TransactionSchema = new Schema<ITransaction>(
  {
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ['revenue', 'expense', 'investment', 'financing'],
      required: true,
    },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    reference: { type: String },
    status: {
      type: String,
      enum: ['completed', 'pending', 'cancelled'],
      default: 'completed',
    },
  },
  { _id: false }
);

const BurnRateSchema = new Schema<IBurnRate>(
  {
    grossBurn: { type: Number, required: true },
    netBurn: { type: Number, required: true },
    fixedCosts: { type: Number, required: true },
    variableCosts: { type: Number, required: true },
    averageMonthlyBurn: { type: Number, required: true },
    burnRateTrend: {
      type: String,
      enum: ['increasing', 'decreasing', 'stable'],
      required: true,
    },
    percentChange: { type: Number, required: true },
  },
  { _id: false }
);

const RunwaySchema = new Schema<IRunway>(
  {
    currentCash: { type: Number, required: true },
    monthlyBurn: { type: Number, required: true },
    monthsRemaining: { type: Number, required: true },
    projectedDepletionDate: { type: Date, required: true },
    runwayStatus: {
      type: String,
      enum: ['healthy', 'warning', 'critical'],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const CashflowForecastSchema = new Schema<ICashflowForecast>(
  {
    period: { type: String, required: true },
    projectedRevenue: { type: Number, required: true },
    projectedExpenses: { type: Number, required: true },
    netCashflow: { type: Number, required: true },
    endingBalance: { type: Number, required: true },
  },
  { _id: false }
);

const FinancialAlertSchema = new Schema<IFinancialAlert>(
  {
    type: {
      type: String,
      enum: ['cash_warning', 'burn_rate', 'runway_low', 'revenue_decline', 'expense_spike'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
    },
    message: { type: String, required: true },
    value: { type: Number },
    threshold: { type: Number },
    recommendation: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FinancialDataSchema = new Schema<IFinancialData>(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentCash: { type: Number, required: true, default: 0 },
    monthlyRevenue: { type: Number, required: true, default: 0 },
    monthlyExpenses: { type: Number, required: true, default: 0 },
    transactions: { type: [TransactionSchema], default: [] },
    burnRate: { type: BurnRateSchema, required: true },
    runway: { type: RunwaySchema, required: true },
    forecasts: { type: [CashflowForecastSchema], default: [] },
    alerts: { type: [FinancialAlertSchema], default: [] },
    lastUpdated: { type: Date, default: Date.now },
    metadata: {
      currency: { type: String, default: 'USD' },
      fiscalYearStart: { type: Date, required: true },
      industry: { type: String },
    },
  },
  {
    timestamps: true,
    collection: 'financial_data',
  }
);

// Indexes for efficient queries
FinancialDataSchema.index({ tenantId: 1 });
FinancialDataSchema.index({ 'transactions.date': -1 });
FinancialDataSchema.index({ lastUpdated: -1 });

const FinancialData: Model<IFinancialData> = mongoose.model<IFinancialData>(
  'FinancialData',
  FinancialDataSchema
);

export default FinancialData;
