/**
 * LEDGERAI - Accounting AI Operating System
 * Production-Ready MongoDB Models
 */

import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// USER MODEL (for Authentication)
// ============================================

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'accountant' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'accountant', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

// ============================================
// ACCOUNT MODEL
// ============================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountCategory = 'cash' | 'bank' | 'accounts_receivable' | 'inventory' |
                              'accounts_payable' | 'credit_card' | 'loan' | 'equity' |
                              'sales' | 'cost_of_sales' | 'operating_expense' | 'other_income' | 'other_expense';

export interface IAccount extends Document {
  name: string;
  code: string;
  type: AccountType;
  category: AccountCategory;
  balance: number;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'], required: true },
  category: {
    type: String,
    enum: ['cash', 'bank', 'accounts_receivable', 'inventory', 'accounts_payable',
           'credit_card', 'loan', 'equity', 'sales', 'cost_of_sales',
           'operating_expense', 'other_income', 'other_expense'],
    required: true
  },
  balance: { type: Number, default: 0 },
  description: { type: String, trim: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Account' },
  isActive: { type: Boolean, default: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AccountSchema.index({ type: 1 });
AccountSchema.index({ category: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ code: 1 }, { unique: true });

// ============================================
// TRANSACTION MODEL
// ============================================

export interface ITransactionEntry {
  accountId: mongoose.Types.ObjectId;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
}

export interface ITransaction extends Document {
  date: Date;
  description: string;
  accounts: ITransactionEntry[];
  amount: number;
  category: string;
  subcategory?: string;
  reference?: string;
  reconciled: boolean;
  reconciledAt?: Date;
  reconciledBy?: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionEntrySchema = new Schema<ITransactionEntry>({
  accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
  accountCode: { type: String },
  accountName: { type: String },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 }
}, { _id: false });

const TransactionSchema = new Schema<ITransaction>({
  date: { type: Date, default: Date.now, required: true },
  description: { type: String, required: true, trim: true },
  accounts: { type: [TransactionEntrySchema], required: true, validate: [(val: ITransactionEntry[]) => val.length >= 2, 'Transaction must have at least 2 accounts'] },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  subcategory: { type: String, trim: true },
  reference: { type: String, trim: true },
  reconciled: { type: Boolean, default: false },
  reconciledAt: { type: Date },
  reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, trim: true },
  attachments: { type: [String], default: [] },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

TransactionSchema.index({ date: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ reconciled: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ date: 1, category: 1 });

// ============================================
// INVOICE MODEL
// ============================================

export interface IInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';

export interface IInvoice extends Document {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  items: IInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  dueDate: Date;
  issueDate: Date;
  paidDate?: Date;
  notes?: string;
  terms?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  id: { type: String, required: true },
  description: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, trim: true, lowercase: true },
  customerAddress: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  items: { type: [InvoiceItemSchema], required: true, validate: [(val: IInvoiceItem[]) => val.length > 0, 'Invoice must have at least one item'] },
  subtotal: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  taxAmount: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  dueDate: { type: Date, required: true },
  issueDate: { type: Date, default: Date.now },
  paidDate: { type: Date },
  notes: { type: String, trim: true },
  terms: { type: String, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

InvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ customerId: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ dueDate: 1 });
InvoiceSchema.index({ userId: 1 });
InvoiceSchema.index({ issueDate: 1 });

// ============================================
// BUDGET MODEL
// ============================================

export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface IBudget extends Document {
  category: string;
  subcategory?: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  isActive: boolean;
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>({
  category: { type: String, required: true, trim: true },
  subcategory: { type: String, trim: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budgeted: { type: Number, required: true, min: 0 },
  actual: { type: Number, default: 0, min: 0 },
  variance: { type: Number, default: 0 },
  variancePercentage: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

BudgetSchema.index({ period: 1 });
BudgetSchema.index({ category: 1 });
BudgetSchema.index({ startDate: 1, endDate: 1 });
BudgetSchema.index({ userId: 1 });

// ============================================
// PAYMENT MODEL (for Invoice Payments)
// ============================================

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  reference?: string;
  notes?: string;
  processedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'bank_transfer', 'credit_card', 'other'],
    required: true
  },
  reference: { type: String, trim: true },
  notes: { type: String, trim: true },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

PaymentSchema.index({ invoiceId: 1 });
PaymentSchema.index({ createdAt: 1 });

// ============================================
// AUDIT LOG MODEL
// ============================================

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId },
  details: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true, collection: 'audit_logs' });

AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: 1 });

// ============================================
// EXPORT MODELS
// ============================================

export const User = mongoose.model<IUser>('User', UserSchema);
export const Account = mongoose.model<IAccount>('Account', AccountSchema);
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export const Models = { User, Account, Transaction, Invoice, Budget, Payment, AuditLog };
export default Models;