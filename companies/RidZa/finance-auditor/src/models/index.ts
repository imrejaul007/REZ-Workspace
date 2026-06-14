/**
 * MongoDB Models for Finance Auditor
 */
import mongoose, { Schema, Document } from 'mongoose';

/**
 * Audit Alert Model
 */
export interface IAuditAlert extends Document {
  alertId: string;
  tenantId: string;
  type: 'fraud' | 'duplicate' | 'anomaly' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  amount?: number;
  transactionId?: string;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

const AuditAlertSchema = new Schema<IAuditAlert>({
  alertId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  type: { type: String, enum: ['fraud', 'duplicate', 'anomaly', 'compliance'], required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  description: { type: String, required: true },
  amount: { type: Number },
  transactionId: { type: String, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date },
});

export const AuditAlert = mongoose.model<IAuditAlert>('AuditAlert', AuditAlertSchema);

/**
 * Audit Report Model
 */
export interface IAuditReport extends Document {
  reportId: string;
  tenantId: string;
  type: 'internal' | 'external' | 'compliance' | 'fraud-investigation';
  findings: string[];
  risk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  date: Date;
  transactionsAnalyzed: number;
  alertsGenerated: number;
  generatedBy: string;
}

const AuditReportSchema = new Schema<IAuditReport>({
  reportId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  type: { type: String, enum: ['internal', 'external', 'compliance', 'fraud-investigation'], required: true },
  findings: { type: [String], default: [] },
  risk: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  riskScore: { type: Number, default: 0 },
  date: { type: Date, default: Date.now, index: true },
  transactionsAnalyzed: { type: Number, default: 0 },
  alertsGenerated: { type: Number, default: 0 },
  generatedBy: { type: String, default: 'system' },
});

export const AuditReport = mongoose.model<IAuditReport>('AuditReport', AuditReportSchema);

/**
 * Transaction Model (for historical analysis)
 */
export interface ITransaction extends Document {
  transactionId: string;
  tenantId: string;
  amount: number;
  currency: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  type: 'payment' | 'transfer' | 'refund';
  hash: string;
  metadata?: Record<string, unknown>;
  analyzed: boolean;
  fraudScore?: number;
}

const TransactionSchema = new Schema<ITransaction>({
  transactionId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  senderId: { type: String, required: true, index: true },
  receiverId: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  type: { type: String, enum: ['payment', 'transfer', 'refund'], required: true },
  hash: { type: String, required: true, index: true },
  metadata: { type: Schema.Types.Mixed },
  analyzed: { type: Boolean, default: false },
  fraudScore: { type: Number },
});

TransactionSchema.index({ tenantId: 1, timestamp: -1 });
TransactionSchema.index({ tenantId: 1, receiverId: 1, timestamp: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

/**
 * Invoice Model (for duplicate detection)
 */
export interface IInvoice extends Document {
  invoiceId: string;
  tenantId: string;
  amount: number;
  currency: string;
  vendorId: string;
  date: Date;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  hash: string;
  normalizedHash: string;
  createdAt: Date;
}

const LineItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
  invoiceId: { type: String, required: true, unique: true, index: true },
  tenantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  vendorId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  lineItems: { type: [LineItemSchema], default: [] },
  hash: { type: String, required: true, index: true },
  normalizedHash: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

InvoiceSchema.index({ tenantId: 1, normalizedHash: 1 });
InvoiceSchema.index({ tenantId: 1, vendorId: 1, date: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

/**
 * Risk Assessment Cache Model
 */
export interface IRiskAssessment extends Document {
  tenantId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{
    category: string;
    score: number;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
  lastAssessment: Date;
  expiresAt: Date;
}

const RiskFactorSchema = new Schema({
  category: { type: String, required: true },
  score: { type: Number, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
}, { _id: false });

const RiskAssessmentSchema = new Schema<IRiskAssessment>({
  tenantId: { type: String, required: true, unique: true, index: true },
  overallRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  riskScore: { type: Number, required: true },
  factors: { type: [RiskFactorSchema], default: [] },
  recommendations: { type: [String], default: [] },
  lastAssessment: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: true },
});

export const RiskAssessmentModel = mongoose.model<IRiskAssessment>('RiskAssessment', RiskAssessmentSchema);