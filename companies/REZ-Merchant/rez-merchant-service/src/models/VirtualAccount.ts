/**
 * Virtual Account Model
 *
 * Enables unique virtual account numbers for suppliers/customers for payment tracking.
 * Each supplier/customer gets a virtual account that maps to a real bank account.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// ── Enums ────────────────────────────────────────────────────────────────────

export type VirtualAccountStatus = 'active' | 'inactive' | 'suspended' | 'closed';
export type VirtualAccountType = 'supplier' | 'customer' | 'partner' | 'internal';
export type BankCode = 'HDFC' | 'ICICI' | 'SBI' | 'AXIS' | 'KOTAK' | 'YES' | 'OTHER';

// ── Interface ─────────────────────────────────────────────────────────────────

export interface IVirtualAccount extends Document {
  // Core identification
  virtualAccountNumber: string; // Format: VA-XXXXXXXX (12 chars)
  accountHolderName: string;

  // Relationships
  merchantId: Types.ObjectId;
  linkedEntityType: VirtualAccountType;
  linkedEntityId: Types.ObjectId; // Supplier, Customer, Partner ID

  // Bank details
  bankCode: BankCode;
  virtualAccount_ifsc?: string;
  virtualAccountNumber_bank?: string; // Bank's internal VA number

  // Real account (where funds land)
  realAccountNumber?: string;
  realAccountIfsc?: string;
  realAccountHolder?: string;

  // Limits and settings
  maxTransactionAmount?: number;
  minTransactionAmount?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  dailyUsedAmount?: number;
  monthlyUsedAmount?: number;

  // UPI (optional virtual UPI ID)
  upiId?: string;

  // Status
  status: VirtualAccountStatus;
  statusReason?: string;

  // QR Code
  qrCodeUrl?: string;
  qrCodeBase64?: string;

  // Usage tracking
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  lastTransactionAt?: Date;
  lastActivityAt?: Date;

  // Expiry
  validFrom: Date;
  validUntil?: Date;

  // Reference
  reference: string; // Internal reference (supplier code, customer ID, etc.)

  // Notifications
  notifyOnCredit: boolean;
  notifyEmail?: string;
  notifyPhone?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────

const VirtualAccountSchema = new Schema<IVirtualAccount>(
  {
    virtualAccountNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    linkedEntityType: {
      type: String,
      enum: Object.values(['supplier', 'customer', 'partner', 'internal']),
      required: true,
    },
    linkedEntityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    bankCode: {
      type: String,
      enum: Object.values(['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'YES', 'OTHER']),
      default: 'HDFC',
    },
    virtualAccount_ifsc: {
      type: String,
      uppercase: true,
      trim: true,
    },
    virtualAccountNumber_bank: {
      type: String,
      trim: true,
    },
    realAccountNumber: {
      type: String,
      trim: true,
    },
    realAccountIfsc: {
      type: String,
      uppercase: true,
      trim: true,
    },
    realAccountHolder: String,
    maxTransactionAmount: {
      type: Number,
      min: 0,
    },
    minTransactionAmount: {
      type: Number,
      min: 0,
      default: 1,
    },
    dailyLimit: {
      type: Number,
      min: 0,
    },
    monthlyLimit: {
      type: Number,
      min: 0,
    },
    dailyUsedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    monthlyUsedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    upiId: {
      type: String,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(['active', 'inactive', 'suspended', 'closed']),
      default: 'active',
      index: true,
    },
    statusReason: String,
    qrCodeUrl: String,
    qrCodeBase64: String,
    totalTransactions: {
      type: Number,
      default: 0,
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    totalDebits: {
      type: Number,
      default: 0,
    },
    lastTransactionAt: Date,
    lastActivityAt: Date,
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: Date,
    reference: {
      type: String,
      trim: true,
      index: true,
    },
    notifyOnCredit: {
      type: Boolean,
      default: true,
    },
    notifyEmail: String,
    notifyPhone: String,
    metadata: Schema.Types.Mixed,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
    collection: 'virtual_accounts',
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────

VirtualAccountSchema.index({ merchantId: 1, status: 1 });
VirtualAccountSchema.index({ merchantId: 1, linkedEntityType: 1, linkedEntityId: 1 });
VirtualAccountSchema.index({ merchantId: 1, bankCode: 1 });
VirtualAccountSchema.index({ validFrom: 1, validUntil: 1 });

// ── Statics ────────────────────────────────────────────────────────────────────

/**
 * Generate a unique virtual account number
 */
VirtualAccountSchema.statics.generateAccountNumber = async function (): Promise<string> {
  const prefix = 'VA';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const candidate = `${prefix}${timestamp}${random}`.substring(0, 12);

  // Ensure uniqueness
  const existing = await this.findOne({ virtualAccountNumber: candidate });
  if (existing) {
    // Try again with different random
    return this.generateAccountNumber();
  }

  return candidate;
};

/**
 * Find account by virtual account number
 */
VirtualAccountSchema.statics.findByVANumber = async function (vaNumber: string) {
  return this.findOne({
    virtualAccountNumber: vaNumber.toUpperCase(),
    isDeleted: false,
    status: 'active',
  });
};

/**
 * Get accounts for a specific entity
 */
VirtualAccountSchema.statics.findByEntity = async function (
  merchantId: Types.ObjectId,
  entityType: VirtualAccountType,
  entityId: Types.ObjectId
) {
  return this.find({
    merchantId,
    linkedEntityType: entityType,
    linkedEntityId: entityId,
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

/**
 * Reset daily/monthly usage (call via cron job)
 */
VirtualAccountSchema.statics.resetDailyUsage = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await this.updateMany({ isDeleted: false }, { dailyUsedAmount: 0 });
};

VirtualAccountSchema.statics.resetMonthlyUsage = async function () {
  const today = new Date();
  today.setDate(1);
  today.setHours(0, 0, 0, 0);
  await this.updateMany({ isDeleted: false }, { monthlyUsedAmount: 0 });
};

// ── Methods ────────────────────────────────────────────────────────────────────

/**
 * Record a credit transaction
 */
VirtualAccountSchema.methods.recordCredit = function (amount: number): void {
  this.totalCredits += amount;
  this.totalTransactions += 1;
  this.dailyUsedAmount = (this.dailyUsedAmount || 0) + amount;
  this.monthlyUsedAmount = (this.monthlyUsedAmount || 0) + amount;
  this.lastTransactionAt = new Date();
  this.lastActivityAt = new Date();
};

/**
 * Record a debit transaction
 */
VirtualAccountSchema.methods.recordDebit = function (amount: number): void {
  this.totalDebits += amount;
  this.totalTransactions += 1;
  this.lastTransactionAt = new Date();
  this.lastActivityAt = new Date();
};

/**
 * Check if transaction is within limits
 */
VirtualAccountSchema.methods.checkLimits = function (amount: number): { allowed: boolean; reason?: string } {
  const now = new Date();

  // Check valid dates
  if (this.validFrom > now || (this.validUntil && this.validUntil < now)) {
    return { allowed: false, reason: 'Account validity expired' };
  }

  // Check status
  if (this.status !== 'active') {
    return { allowed: false, reason: `Account is ${this.status}` };
  }

  // Check min/max
  if (this.minTransactionAmount && amount < this.minTransactionAmount) {
    return { allowed: false, reason: `Amount below minimum ${this.minTransactionAmount}` };
  }
  if (this.maxTransactionAmount && amount > this.maxTransactionAmount) {
    return { allowed: false, reason: `Amount exceeds maximum ${this.maxTransactionAmount}` };
  }

  // Check daily limit
  if (this.dailyLimit && (this.dailyUsedAmount || 0) + amount > this.dailyLimit) {
    return { allowed: false, reason: `Would exceed daily limit` };
  }

  // Check monthly limit
  if (this.monthlyLimit && (this.monthlyUsedAmount || 0) + amount > this.monthlyLimit) {
    return { allowed: false, reason: `Would exceed monthly limit` };
  }

  return { allowed: true };
};

/**
 * Activate account
 */
VirtualAccountSchema.methods.activate = function (): void {
  this.status = 'active';
  this.statusReason = undefined;
};

/**
 * Suspend account
 */
VirtualAccountSchema.methods.suspend = function (reason: string): void {
  this.status = 'suspended';
  this.statusReason = reason;
};

/**
 * Close account
 */
VirtualAccountSchema.methods.close = function (reason?: string): void {
  this.status = 'closed';
  this.statusReason = reason;
  this.isDeleted = true;
  this.deletedAt = new Date();
};

// ── Export ─────────────────────────────────────────────────────────────────────

export const VirtualAccount = mongoose.model<IVirtualAccount>('VirtualAccount', VirtualAccountSchema);
